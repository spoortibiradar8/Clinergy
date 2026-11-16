"""
ClinErgy Chatbot Service — Python port of chatbotService.js
Builds a rich system prompt from live Supabase data and calls Groq LLM.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from config import settings
from database.connection import get_supabase
from schemas.models import ChatMessage

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "llama-3.3-70b-versatile"


# ── Data-fetching helpers ─────────────────────────────────────

def _fetch_zone_summary() -> list[dict]:
    try:
        db = get_supabase()
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        resp = (
            db.table("zone_readings")
            .select("zone_name,power_kw,temperature,status,energy_kwh_today,recorded_at")
            .gte("recorded_at", cutoff)
            .order("recorded_at", desc=True)
            .limit(50)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


def _fetch_active_alerts() -> list[dict]:
    try:
        db = get_supabase()
        resp = (
            db.table("alerts")
            .select("severity,zone_id,message,created_at")
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


def _fetch_latest_prediction() -> Optional[dict]:
    try:
        db = get_supabase()
        resp = (
            db.table("ai_predictions")
            .select("forecast_kwh,estimated_cost_inr,at_risk_zone,recommendation,savings_inr")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return (resp.data or [None])[0]
    except Exception:
        return None


def _fetch_maintenance() -> list[dict]:
    try:
        db = get_supabase()
        resp = (
            db.table("maintenance")
            .select("zone_id,type,status,scheduled_at,technician")
            .order("scheduled_at", desc=True)
            .limit(10)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


# ── System prompt builder ──────────────────────────────────────────

async def _build_system_prompt(current_page: str, user_role: str) -> str:
    import json
    from services.weather_service import fetch_weather

    zones       = _fetch_zone_summary()
    alerts      = _fetch_active_alerts()
    prediction  = _fetch_latest_prediction()
    maintenance = _fetch_maintenance()

    try:
        weather_resp = await fetch_weather()
        w = weather_resp.weather
        weather_str = f"Temperature: {w.temperature}°C, Condition: {w.condition}, Humidity: {w.humidity}%"
    except Exception:
        weather_str = "Weather data unavailable."

    ist_hour = (datetime.now(timezone.utc).hour + 5) % 24
    tariff = f"₹8.5/kWh (Peak)" if 6 <= ist_hour < 22 else "₹5.2/kWh (Off-Peak)"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M IST")

    zones_txt       = json.dumps(zones,       indent=2) if zones       else "No sensor data available yet."
    alerts_txt      = json.dumps(alerts,      indent=2) if alerts      else "No active alerts."
    prediction_txt  = json.dumps(prediction,  indent=2) if prediction  else "No prediction data available yet."
    maintenance_txt = json.dumps(maintenance, indent=2) if maintenance else "No maintenance records found."

    return f"""You are CLINERGY Assistant — a smart, friendly, and expert AI chatbot embedded in CLINERGY,
a hospital energy management system in Bengaluru, India.

Your personality: Professional yet warm. Precise with numbers. Proactive with suggestions.
You support all hospital staff roles — from admins to viewers.

## Current Context
- **Date & Time (IST):** {now_str}
- **Current Electricity Tariff:** {tariff}
- **User Role:** {user_role}
- **Current Page:** {current_page}

## Live Zone Sensor Data (Last Hour)
{zones_txt}

## Active Alerts
{alerts_txt}

## Latest AI Energy Prediction
{prediction_txt}

## Maintenance Schedule
{maintenance_txt}

## Current Weather in Bengaluru
{weather_str}

## Your Capabilities
You can answer questions about:
1. **Energy Usage** — Real-time power consumption per zone (ICU, OPD, Surgery, etc.)
2. **Alerts & Anomalies** — Active alerts, severity, and which zones are at risk
3. **Cost & Tariffs** — Current tariff, estimated costs, savings recommendations
4. **AI Predictions** — Energy forecasts, confidence levels, at-risk zones
5. **Maintenance** — Scheduled tasks, technician assignments, equipment status
6. **Weather Impact** — How current weather affects energy (HVAC load, etc.)
7. **Navigation Help** — How to find features within CLINERGY
8. **General Hospital Energy Questions** — Best practices, efficiency tips, sustainability

## Rules
- Always be helpful, accurate, and concise.
- When referencing live data, cite the numbers.
- If data is unavailable, say so clearly.
- Format responses using markdown (bold for numbers, bullet points for lists).
- Keep responses under 200 words unless the user asks for a detailed report.
- Never fabricate data — only use what is in the context above."""


# ── Public entry points ─────────────────────────────────────────────────

async def send_chat_message(
    history: list[ChatMessage],
    user_message: str,
    current_page: str = "/",
    user_role: str = "Staff",
) -> str:
    """
    Send a message to the Groq LLM chatbot with a full live-data system prompt.
    Returns the assistant's reply as a plain string.
    """
    if not settings.groq_api_key:
        return (
            "**AI not configured.** Please set `GROQ_API_KEY` in `backend/.env`.\n\n"
            "In the meantime, check the **Dashboard** or **AI Insights** page for live data."
        )

    try:
        system_prompt = await _build_system_prompt(current_page, user_role)

        messages = [{"role": "system", "content": system_prompt}]
        for m in history:
            if m.role in ("user", "assistant"):
                messages.append({"role": m.role, "content": m.content})
        messages.append({"role": "user", "content": user_message})

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.groq_api_key}",
        }
        body = {
            "model": _GROQ_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 600,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(_GROQ_URL, headers=headers, json=body)
            resp.raise_for_status()

        return resp.json()["choices"][0]["message"]["content"]

    except Exception as exc:
        if "401" in str(exc) or "API" in str(exc):
            return " **Invalid API key.** Please check `GROQ_API_KEY` in `backend/.env`."
        return "I'm having trouble connecting right now. Please try again in a moment."


def get_quick_replies(current_page: str) -> list[str]:
    """Return context-aware quick-reply suggestions for the given page."""
    page_map: dict[str, list[str]] = {
        "/":             ["Which zone uses most energy?", "Today's energy forecast", "Any critical alerts?"],
        "/live":         ["Which zone is overloading?", "Real-time power summary", "Temperature alerts?"],
        "/zones":        ["Compare zone efficiency", "Which zone needs attention?", "Best performing zone?"],
        "/ai-insights":  ["Explain the energy forecast", "What's the confidence level?", "Cost prediction for today?"],
        "/alerts":       ["What caused the latest alert?", "How many critical alerts?", "Which zone has most alerts?"],
        "/maintenance":  ["What's scheduled today?", "Pending maintenance tasks?", "Which equipment needs service?"],
        "/reports":      ["Summarize last week", "Highest energy day?", "Carbon footprint summary"],
        "/settings":     ["How do I change units?", "How do I enable dark mode?", "Notification settings?"],
    }
    base = ["What's the current energy status?", "Any active alerts?", "Show me cost savings tips"]
    return page_map.get(current_page, base)
