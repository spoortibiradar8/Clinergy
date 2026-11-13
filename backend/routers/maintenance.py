"""Maintenance router — asset registry and scheduling via Supabase."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from database.connection import get_supabase

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/equipment", response_model=list[dict])
def get_equipment(
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None, description="Filter by status"),
):
    """Return the maintenance equipment registry from Supabase."""
    try:
        db = get_supabase()
        q = (
            db.table("maintenance_equipment")
            .select("*")
            .order("health_score", desc=False)   # lowest health first
            .limit(limit)
        )
        if status:
            q = q.eq("status", status)
        return q.execute().data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/schedules", response_model=list[dict])
def get_schedules(
    limit: int = Query(50, ge=1, le=200),
    upcoming_only: bool = Query(False),
):
    """Return maintenance schedules, optionally filtering to future dates only."""
    try:
        from datetime import datetime, timezone
        db = get_supabase()
        q = (
            db.table("maintenance_schedules")
            .select("*")
            .order("scheduled_date", desc=False)
            .limit(limit)
        )
        if upcoming_only:
            q = q.gte("scheduled_date", datetime.now(timezone.utc).isoformat())
        return q.execute().data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/schedules", response_model=dict)
def create_schedule(payload: dict):
    """
    Insert a new maintenance schedule entry.
    Expected body: { equipment_id, technician_name, scheduled_date, notes? }
    """
    required = {"equipment_id", "technician_name", "scheduled_date"}
    if not required.issubset(payload.keys()):
        raise HTTPException(
            status_code=422,
            detail=f"Missing required fields: {required - payload.keys()}",
        )
    try:
        db = get_supabase()
        resp = db.table("maintenance_schedules").insert(payload).execute()
        return (resp.data or [{}])[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/equipment/{equipment_id}", response_model=dict)
def update_equipment(equipment_id: str, payload: dict):
    """Update health score or status for a specific piece of equipment."""
    try:
        db = get_supabase()
        resp = (
            db.table("maintenance_equipment")
            .update(payload)
            .eq("id", equipment_id)
            .execute()
        )
        data = resp.data or []
        if not data:
            raise HTTPException(status_code=404, detail="Equipment not found")
        return data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
