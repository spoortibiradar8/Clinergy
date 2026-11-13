"""
ClinErgy AI Insights Service — Python port of aiInsightsService.js
Uses the Groq API (llama-3.3-70b) to generate 7-day energy demand forecasts,
anomaly detection, and cost savings recommendations from live Supabase data.
Falls back to Scikit-Learn linear regression when the API is unavailable.
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
import numpy as np
from sklearn.linear_model import LinearRegression

from config import settings
from database.connection import get_supabase
from schemas.models import AIInsightsResponse, DayPrediction
from services.weather_service import fetch_weather

# ── Constants ─────────────────────────────────────────────────────────────────
_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "llama-3.3-70b-versatile"
_PEAK_TARIFF = 8.5    # ₹/kWh  (06:00–22:00 IST)
_OFFPEAK_TARIFF = 5.2 # ₹/kWh

# In-memory cache (5-minute TTL)
_cache: Optional[AIInsightsResponse] = None
_cache_ts: float = 0.0
_CACHE_TTL = 300  # seconds

_FALLBACK = AIInsightsResponse(
    forecast_kwh=1250,
    estimated_cost_inr=10625,
    confidence_percent=0,
    at_risk_zone="Unavailable",
    risk_reason="AI analysis temporarily unavailable — showing estimates",
    recommendation="Unable to generate recommendation — check API connection",
    savings_inr=0,
    day_predictions=[
        DayPrediction(day="Today",        predicted_kwh=1200),
        DayPrediction(day="Tomorrow",     predicted_kwh=1250),
        DayPrediction(day="Day 3",        predicted_kwh=1230),
        DayPrediction(day="Day 4",        predicted_kwh=1210),
        DayPrediction(day="Day 5",        predicted_kwh=1190),
        DayPrediction(day="Day 6 (Sat)",  predicted_kwh=980),
        DayPrediction(day="Day 7 (Sun)",  predicted_kwh=950),
    ],
    anomaly_detected=False,
    anomaly_message="",
    isfallback=True,
)


# ── Supabase helpers ──────────────────────────────────────────────────────────

def _fetch_recent_zone_data() -> list[dict]:
    """Pull last 2 hours of zone readings and aggregate per zone."""
    try:
        db = get_supabase()
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        resp = (
            db.table("zone_readings")
            .select("zone_name,power_kw,temperature,status,energy_kwh_today,recorded_at")
            .gte("recorded_at", cutoff)
            .order("recorded_at", desc=True)
            .limit(30)
            .execute()
        )
        rows: list[dict] = resp.data or []
        if not rows:
            return []

        zone_map: dict[str, dict] = {}
        for r in rows:
            n = r["zone_name"]
            if n not in zone_map:
                zone_map[n] = dict(
                    zone=n,
                    latest_power_kw=r["power_kw"],
                    latest_temp=r["temperature"],
                    status=r["status"],
                    energy_kwh_today=r["energy_kwh_today"],
                    count=0, total_power=0.0,
                )
            zone_map[n]["count"] += 1
            zone_map[n]["total_power"] += r["power_kw"] or 0

        return [
            dict(
                zone=v["zone"],
                latest_power_kw=v["latest_power_kw"],
                avg_power_kw=round(v["total_power"] / v["count"], 2),
                temperature=v["latest_temp"],
                status=v["status"],
                energy_kwh_today=v["energy_kwh_today"],
            )
            for v in zone_map.values()
        ]
    except Exception:
        return []


# ── Scikit-Learn fallback forecast ────────────────────────────────────────────

def _sklearn_forecast(recent: list[dict]) -> AIInsightsResponse:
    """
    Simple linear regression over recent zone averages to project 7 days.
    Used when Groq API is unavailable.
    """
    total_avg = sum(z["avg_power_kw"] for z in recent) if recent else 583
    # Simulate 24 h of hourly readings as training data
    hours = np.arange(24).reshape(-1, 1)
    load_factors = np.array([
        0.60, 0.60, 0.60, 0.60, 0.60, 0.60,
        0.75, 0.75, 0.75, 1.00, 1.00, 1.00,
        1.00, 0.95, 0.95, 0.95, 0.85, 0.85,
        0.85, 0.75, 0.75, 0.75, 0.65, 0.65,
    ])
    kwh_profile = load_factors * total_avg
    model = LinearRegression().fit(hours, kwh_profile)
    daily_kwh = round(float(model.predict(hours).sum()), 1)

    day_labels = ["Today", "Tomorrow", "Day 3", "Day 4",
                  "Day 5", "Day 6 (Sat)", "Day 7 (Sun)"]
    weekend_factors = [1.0, 1.02, 1.01, 0.99, 0.97, 0.82, 0.80]
    predictions = [
        DayPrediction(day=d, predicted_kwh=round(daily_kwh * f, 1))
        for d, f in zip(day_labels, weekend_factors)
    ]

    ist_hour = (datetime.now(timezone.utc).hour + 5) % 24
    tariff = _PEAK_TARIFF if 6 <= ist_hour < 22 else _OFFPEAK_TARIFF
    cost = round(daily_kwh * tariff, 2)
    savings = round(daily_kwh * 0.07 * tariff, 2)   # 7% reduction estimate

    at_risk = max(recent, key=lambda z: z["avg_power_kw"])["zone"] if recent else "ICU"

    return AIInsightsResponse(
        forecast_kwh=daily_kwh,
        estimated_cost_inr=cost,
        confidence_percent=72,
        at_risk_zone=at_risk,
        risk_reason=f"Zone {at_risk} has the highest average load. Consider load-shedding during peak tariff.",
        recommendation=f"Reducing {at_risk} non-essential load by 10% during 18:00–22:00 IST could save ₹{savings}/day.",
        savings_inr=savings,
        day_predictions=predictions,
        anomaly_detected=False,
        anomaly_message="",
        isfallback=False,
    )


# ── Groq API call ─────────────────────────────────────────────────────────────

async def _call_groq(recent: list[dict], weather_temp: float,
                     weather_cond: str, weather_hum: int) -> AIInsightsResponse:
    ist_hour = (datetime.now(timezone.utc).hour + 5) % 24
    tariff = _PEAK_TARIFF if 6 <= ist_hour < 22 else _OFFPEAK_TARIFF
    period = "peak" if 6 <= ist_hour < 22 else "off-peak"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M IST")

    prompt = f"""You are an AI energy analyst for a hospital called CLINERGY in Bengaluru, India.
Analyze this real sensor data and respond with valid JSON only. No markdown formatting.

REAL ZONE SENSOR DATA (last 2 hours):
{json.dumps(recent, indent=2)}

CURRENT WEATHER IN BENGALURU:
Temperature: {weather_temp}°C  Condition: {weather_cond}  Humidity: {weather_hum}%

CURRENT TIME: {now_str}
CURRENT TARIFF: ₹{tariff}/kWh ({period} hours)
PEAK HOURS: 6:00 AM to 10:00 PM IST

Respond with ONLY this JSON structure:
{{
  "forecast_kwh": <number>,
  "estimated_cost_inr": <number>,
  "confidence_percent": <integer 60-95>,
  "at_risk_zone": "<exact zone name>",
  "risk_reason": "<specific reason with actual numbers>",
  "recommendation": "<one actionable recommendation with rupee savings>",
  "savings_inr": <number>,
  "day_predictions": [
    {{"day": "Today",       "predicted_kwh": <number>}},
    {{"day": "Tomorrow",    "predicted_kwh": <number>}},
    {{"day": "Day 3",       "predicted_kwh": <number>}},
    {{"day": "Day 4",       "predicted_kwh": <number>}},
    {{"day": "Day 5",       "predicted_kwh": <number>}},
    {{"day": "Day 6 (Sat)", "predicted_kwh": <number>}},
    {{"day": "Day 7 (Sun)", "predicted_kwh": <number>}}
  ],
  "anomaly_detected": <true|false>,
  "anomaly_message": "<describe anomaly or empty string>"
}}"""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.groq_api_key}",
    }
    body = {
        "model": _GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are an energy analytics AI. Always respond with valid JSON only."},
            {"role": "user",   "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 800,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(_GROQ_URL, headers=headers, json=body)
        resp.raise_for_status()

    raw = resp.json()["choices"][0]["message"]["content"]
    parsed = json.loads(raw)

    # Validate & normalise
    required = ["forecast_kwh", "estimated_cost_inr", "confidence_percent",
                "at_risk_zone", "recommendation", "day_predictions"]
    for field in required:
        if field not in parsed:
            raise ValueError(f"Missing field: {field}")

    if not isinstance(parsed["day_predictions"], list) or len(parsed["day_predictions"]) < 7:
        parsed["day_predictions"] = [dp.dict() for dp in _FALLBACK.day_predictions]

    predictions = [DayPrediction(**dp) for dp in parsed["day_predictions"]]

    result = AIInsightsResponse(
        forecast_kwh=parsed["forecast_kwh"],
        estimated_cost_inr=parsed["estimated_cost_inr"],
        confidence_percent=parsed["confidence_percent"],
        at_risk_zone=parsed["at_risk_zone"],
        risk_reason=parsed.get("risk_reason", ""),
        recommendation=parsed["recommendation"],
        savings_inr=parsed.get("savings_inr", 0),
        day_predictions=predictions,
        anomaly_detected=parsed.get("anomaly_detected", False),
        anomaly_message=parsed.get("anomaly_message", ""),
        isfallback=False,
    )

    # Persist to Supabase ai_predictions table (best-effort)
    try:
        db = get_supabase()
        db.table("ai_predictions").insert({
            "forecast_kwh": result.forecast_kwh,
            "estimated_cost_inr": result.estimated_cost_inr,
            "confidence_percent": result.confidence_percent,
            "at_risk_zone": result.at_risk_zone,
            "risk_reason": result.risk_reason,
            "recommendation": result.recommendation,
            "savings_inr": result.savings_inr,
            "day_predictions": [dp.dict() for dp in result.day_predictions],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass

    return result


# ── Public entry point ────────────────────────────────────────────────────────

async def generate_insights() -> AIInsightsResponse:
    """
    Main service function called by the /ai-insights router.
    1. Returns cache if still fresh.
    2. Tries Groq LLM with live data.
    3. Falls back to Scikit-Learn linear model.
    4. Last resort: static fallback object.
    """
    global _cache, _cache_ts

    if _cache and (time.time() - _cache_ts) < _CACHE_TTL:
        return _cache

    recent = _fetch_recent_zone_data()

    # Try Groq if key is configured
    if settings.groq_api_key and recent:
        try:
            weather_resp = await fetch_weather()
            w = weather_resp.weather
            result = await _call_groq(recent, w.temperature, w.condition, w.humidity)
            _cache = result
            _cache_ts = time.time()
            return result
        except Exception:
            pass   # fall through to sklearn

    # Scikit-Learn fallback
    if recent:
        result = _sklearn_forecast(recent)
        _cache = result
        _cache_ts = time.time()
        return result

    return _FALLBACK
