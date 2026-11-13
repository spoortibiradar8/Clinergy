"""
ClinErgy FastAPI Backend — main.py
Entry point for the Python server that replaces all JS service logic.

Start with:
    cd backend
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import ai_insights, alerts, chatbot, environment, maintenance, reports, zones
from services.data_simulator import simulator


# ── Lifespan: start/stop the async IoT simulator ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup  → launch the async telemetry simulator in the background.
    On shutdown → stop the simulator cleanly.
    """
    print("🚀 ClinErgy Python Backend starting…")
    print(f"   Simulator interval : {settings.simulator_interval_seconds}s")
    url_preview = settings.supabase_url[:40] if settings.supabase_url else "NOT CONFIGURED"
    print(f"   Supabase URL       : {url_preview}…")
    simulator.start()
    yield
    print("🛑 ClinErgy Python Backend shutting down…")
    simulator.stop()


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ClinErgy Clinical Energy & Asset Management API",
    description=(
        "Python FastAPI backend for ClinErgy. Provides real-time IoT telemetry "
        "simulation, AI demand forecasting (Groq LLM + Scikit-Learn), server-side "
        "PDF report generation (ReportLab), chatbot, weather, and carbon services."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — allow the Vite dev server and production build ─────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,   # e.g. http://localhost:5173
        "http://localhost:4173",     # vite preview
        "http://localhost:3000",     # fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(zones.router)
app.include_router(alerts.router)
app.include_router(ai_insights.router)
app.include_router(chatbot.router)
app.include_router(environment.router)
app.include_router(reports.router)
app.include_router(maintenance.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {
        "service": "ClinErgy Python Backend",
        "version": "2.0.0",
        "status": "running",
        "simulator_running": simulator._running,
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "zones_in_memory": len(simulator.current_readings),
        "history_ticks": len(simulator.history),
    }
