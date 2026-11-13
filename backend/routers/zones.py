"""Zones router — exposes live telemetry data from the in-memory simulator."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

from database.connection import get_supabase
from services.data_simulator import simulator
from schemas.models import ZoneReading, ZoneReadingList

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("/current", response_model=ZoneReadingList)
def get_current_readings():
    """Return the most recent telemetry tick from the in-memory simulator."""
    if not simulator.current_readings:
        raise HTTPException(status_code=503, detail="Simulator not yet started")
    return ZoneReadingList(
        zones=[ZoneReading(**r) for r in simulator.current_readings],
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/history", response_model=list[ZoneReading])
def get_history(
    zone: str | None = Query(None, description="Filter by zone name"),
    limit: int = Query(100, ge=1, le=1440),
):
    """Return recent in-memory history (up to 1440 ticks = 24 h)."""
    rows = list(simulator.history)
    if zone:
        rows = [r for r in rows if r["zone_name"] == zone]
    rows = rows[-limit:]
    return [ZoneReading(**r) for r in rows]


@router.get("/db-history", response_model=list[ZoneReading])
def get_db_history(
    zone: str | None = Query(None),
    hours: int = Query(2, ge=1, le=48),
    limit: int = Query(200, ge=1, le=1000),
):
    """Fetch historical readings directly from Supabase for analytics."""
    try:
        db = get_supabase()
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        q = (
            db.table("zone_readings")
            .select("*")
            .gte("recorded_at", cutoff)
            .order("recorded_at", desc=True)
            .limit(limit)
        )
        if zone:
            q = q.eq("zone_name", zone)
        data = q.execute().data or []
        return [ZoneReading(**r) for r in data]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
