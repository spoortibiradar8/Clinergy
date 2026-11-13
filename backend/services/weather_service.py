"""
ClinErgy Weather Service — Python port of weatherService.js
Fetches live weather for Bengaluru from the Open-Meteo API (free, no key needed)
and calculates HVAC load impact.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import httpx

from schemas.models import HVACImpact, WeatherData, WeatherResponse

_OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=12.8440&longitude=77.6760"
    "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
    "&timezone=Asia%2FKolkata"
)

# Simple in-memory cache (refreshed every 10 minutes)
_cache: Optional[WeatherResponse] = None
_cache_ts: float = 0.0
_CACHE_TTL = 600  # seconds


def _map_weather_code(code: int) -> tuple[str, str]:
    """Return (condition, emoji_icon) for an Open-Meteo weather code."""
    if code == 0:              return "Clear Sky", "☀️"
    if code in (1, 2, 3):     return "Partly Cloudy", "⛅"
    if code in (45, 48):      return "Foggy", "🌫️"
    if code in (51, 53, 55):  return "Drizzle", "🌦️"
    if code in (61, 63, 65):  return "Rainy", "🌧️"
    if code in (71, 73, 75):  return "Snowy", "❄️"
    if code in (80, 81, 82):  return "Heavy Rain", "⛈️"
    if code == 95:             return "Thunderstorm", "🌩️"
    return "Unknown", "🌡️"


def get_hvac_impact(temperature: float) -> HVACImpact:
    """Calculate extra HVAC cooling load based on outdoor temperature."""
    if temperature > 35:
        return HVACImpact(impact="Very High", extra_load=15,
                          message="Extreme heat — cooling load +15% above baseline")
    if temperature > 30:
        return HVACImpact(impact="High", extra_load=8,
                          message="High temperature — cooling load +8% above baseline")
    if temperature > 25:
        return HVACImpact(impact="Moderate", extra_load=4,
                          message="Warm weather — cooling load +4% above baseline")
    return HVACImpact(impact="Low", extra_load=0,
                      message="Comfortable temperature — no extra cooling load")


async def fetch_weather() -> WeatherResponse:
    """
    Fetch current Bengaluru weather.  Returns cached data if still fresh.
    Falls back to a sensible default if the API is unavailable.
    """
    import time

    global _cache, _cache_ts

    if _cache and (time.time() - _cache_ts) < _CACHE_TTL:
        return _cache

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(_OPEN_METEO_URL)
            resp.raise_for_status()
            data = resp.json()["current"]

        condition, icon = _map_weather_code(data["weather_code"])
        weather = WeatherData(
            temperature=round(data["temperature_2m"], 1),
            humidity=round(data["relative_humidity_2m"]),
            wind_speed=round(data["wind_speed_10m"], 1),
            condition=condition,
            icon=icon,
            fetched_at=datetime.now(timezone.utc),
        )
    except Exception:
        # Fallback — typical Bengaluru afternoon
        weather = WeatherData(
            temperature=28.0, humidity=65, wind_speed=10.0,
            condition="Partly Cloudy", icon="⛅",
            fetched_at=datetime.now(timezone.utc),
        )

    result = WeatherResponse(weather=weather, hvac_impact=get_hvac_impact(weather.temperature))
    _cache = result
    _cache_ts = time.time()
    return result
