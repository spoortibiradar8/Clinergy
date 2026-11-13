from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Zone / Telemetry ──────────────────────────────────────────────────────────

class ZoneReading(BaseModel):
    zone_name: str
    power_kw: float
    energy_kwh_today: float
    temperature: float
    humidity: float
    occupancy_current: int
    occupancy_total: int
    device_count: int
    status: str           # "Normal" | "Warning" | "Critical"
    category: str         # "Critical" | "Semi-Critical" | "General"
    recorded_at: datetime


class ZoneReadingList(BaseModel):
    zones: List[ZoneReading]
    timestamp: datetime


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertEvent(BaseModel):
    id: str
    zone_name: str
    alert_type: str
    severity: str         # "info" | "warning" | "critical"
    message: str
    resolved: bool
    created_at: datetime


# ── AI Insights ───────────────────────────────────────────────────────────────

class DayPrediction(BaseModel):
    day: str
    predicted_kwh: float


class AIInsightsResponse(BaseModel):
    forecast_kwh: float
    estimated_cost_inr: float
    confidence_percent: int
    at_risk_zone: str
    risk_reason: str
    recommendation: str
    savings_inr: float
    day_predictions: List[DayPrediction]
    anomaly_detected: bool
    anomaly_message: str
    isfallback: bool = False
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ── Chatbot ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    history: List[ChatMessage]
    user_message: str
    current_page: Optional[str] = "/"
    user_role: Optional[str] = "Staff"


class ChatResponse(BaseModel):
    reply: str


# ── Carbon ────────────────────────────────────────────────────────────────────

class CarbonEmissions(BaseModel):
    carbon_kg: float
    carbon_trees: int
    carbon_cost: float


class GridCarbonStatus(BaseModel):
    intensity: str          # "Low" | "Medium" | "High"
    g_co2_per_kwh: int
    reason: str


class CarbonResponse(BaseModel):
    emissions: CarbonEmissions
    grid_status: GridCarbonStatus
    last_updated: datetime


# ── Weather ───────────────────────────────────────────────────────────────────

class WeatherData(BaseModel):
    temperature: float
    humidity: int
    wind_speed: float
    condition: str
    icon: str
    fetched_at: datetime


class HVACImpact(BaseModel):
    impact: str     # "Low" | "Moderate" | "High" | "Very High"
    extra_load: int
    message: str


class WeatherResponse(BaseModel):
    weather: WeatherData
    hvac_impact: HVACImpact


# ── PDF Report ────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    start_date: str     # ISO date string e.g. "2025-05-01"
    end_date: str
    zones: Optional[List[str]] = None    # None = all zones
    include_ai: bool = True
    include_maintenance: bool = True
