"""
ClinErgy Data Simulator — Python port of dataSimulator.js
Generates realistic IoT telemetry for all hospital zones every N seconds
and persists each tick to Supabase zone_readings.
"""
from __future__ import annotations

import asyncio
import random
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Callable, Deque, Dict, List, Optional

from database.connection import get_supabase
from schemas.models import AlertEvent, ZoneReading

# ── Zone configuration (mirrors ZONE_CONFIG in JS) ───────────────────────────
ZONE_CONFIG = [
    dict(
        zone_name="ICU",           category="Critical",
        base_power=143,            min_power=120,   max_power=175,
        base_temp=21.5,            min_temp=20.0,   max_temp=23.0,
        occupancy_total=15,        base_occupancy=12,
        device_count=18,
        critical_threshold=170,    warning_threshold=160,
    ),
    dict(
        zone_name="Operation Theatre", category="Critical",
        base_power=210,            min_power=185,   max_power=250,
        base_temp=20.5,            min_temp=19.0,   max_temp=22.0,
        occupancy_total=4,         base_occupancy=3,
        device_count=12,
        critical_threshold=240,    warning_threshold=225,
    ),
    dict(
        zone_name="Emergency",     category="Critical",
        base_power=97,             min_power=80,    max_power=125,
        base_temp=23.0,            min_temp=21.0,   max_temp=25.0,
        occupancy_total=30,        base_occupancy=25,
        device_count=8,
        critical_threshold=120,    warning_threshold=110,
    ),
    dict(
        zone_name="Ward A",        category="Semi-Critical",
        base_power=55,             min_power=40,    max_power=75,
        base_temp=22.0,            min_temp=20.0,   max_temp=24.0,
        occupancy_total=30,        base_occupancy=18,
        device_count=6,
        critical_threshold=72,     warning_threshold=65,
    ),
    dict(
        zone_name="Ward B",        category="Semi-Critical",
        base_power=50,             min_power=38,    max_power=70,
        base_temp=22.0,            min_temp=20.0,   max_temp=24.0,
        occupancy_total=28,        base_occupancy=16,
        device_count=6,
        critical_threshold=68,     warning_threshold=60,
    ),
    dict(
        zone_name="Pharmacy",      category="General",
        base_power=28,             min_power=18,    max_power=40,
        base_temp=18.0,            min_temp=16.0,   max_temp=20.0,
        occupancy_total=8,         base_occupancy=5,
        device_count=4,
        critical_threshold=38,     warning_threshold=34,
    ),
]

MAX_HISTORY = 1440  # 60 ticks/hour × 24 h


# ── Helper functions ──────────────────────────────────────────────────────────

def _load_factor(hour: int) -> float:
    if 0 <= hour < 6:   return 0.60
    if 6 <= hour < 9:   return 0.75
    if 9 <= hour < 13:  return 1.00
    if 13 <= hour < 16: return 0.95
    if 16 <= hour < 19: return 0.85
    if 19 <= hour < 22: return 0.75
    return 0.65


def _random_walk(previous: float, min_v: float, max_v: float,
                 hour: int, max_drift: float = 0.04) -> float:
    drift = (random.random() - 0.5) * 2 * max_drift
    lf = _load_factor(hour)
    nxt = previous * (1 + drift) * lf
    return round(max(min_v, min(max_v, nxt)), 1)


def _get_status(power: float, cfg: dict) -> str:
    if power >= cfg["critical_threshold"]: return "Critical"
    if power >= cfg["warning_threshold"]:  return "Warning"
    return "Normal"


def _get_occupancy(cfg: dict, hour: int) -> int:
    factor = (0.70 if 0 <= hour < 6 else
              0.85 if 6 <= hour < 9 else
              0.90 if 18 <= hour < 22 else
              0.75 if hour >= 22 else 1.0)
    base = round(cfg["base_occupancy"] * factor)
    variation = random.randint(-1, 1)
    return max(0, min(cfg["occupancy_total"], base + variation))


# ── Simulator ─────────────────────────────────────────────────────────────────

class DataSimulator:
    """
    Background asyncio task that ticks every `interval_seconds` seconds,
    generates zone telemetry, stores it in memory, and writes to Supabase.
    """

    def __init__(self, interval_seconds: int = 10):
        self.interval_seconds = interval_seconds
        self._task: Optional[asyncio.Task] = None
        self._running = False

        # Per-zone mutable state
        self._prev_power: Dict[str, float] = {
            z["zone_name"]: z["base_power"] for z in ZONE_CONFIG
        }
        self._energy_today: Dict[str, float] = {
            z["zone_name"]: 0.0 for z in ZONE_CONFIG
        }
        self._prev_status: Dict[str, str] = {
            z["zone_name"]: "Normal" for z in ZONE_CONFIG
        }

        # Shared in-memory stores
        self.current_readings: List[dict] = []
        self.history: Deque[dict] = deque(maxlen=MAX_HISTORY)

        # External alert callbacks (registered by routers/WebSocket handlers)
        self._alert_callbacks: List[Callable[[AlertEvent], None]] = []

    # ── public API ────────────────────────────────────────────────────────────

    def register_alert_callback(self, cb: Callable[[AlertEvent], None]) -> None:
        self._alert_callbacks.append(cb)

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run())

    def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()

    # ── internals ─────────────────────────────────────────────────────────────

    async def _run(self) -> None:
        await self._tick()                          # immediate first tick
        while self._running:
            await asyncio.sleep(self.interval_seconds)
            await self._tick()

    async def _tick(self) -> None:
        now = datetime.now(timezone.utc)
        hour = now.hour
        is_new_day = hour == 0 and now.minute == 0

        rows: List[dict] = []
        for cfg in ZONE_CONFIG:
            name = cfg["zone_name"]
            new_power = _random_walk(
                self._prev_power[name], cfg["min_power"], cfg["max_power"], hour
            )
            new_temp = round(
                max(cfg["min_temp"],
                    min(cfg["max_temp"],
                        cfg["base_temp"] + (random.random() - 0.5) * 0.4)),
                1,
            )
            if is_new_day:
                self._energy_today[name] = 0.0
            added_kwh = round(new_power / 60, 3)          # 1-minute tick equiv.
            self._energy_today[name] = round(
                self._energy_today[name] + added_kwh, 2
            )
            status = _get_status(new_power, cfg)
            self._prev_power[name] = new_power

            row = dict(
                zone_name=name,
                power_kw=new_power,
                energy_kwh_today=self._energy_today[name],
                temperature=new_temp,
                humidity=round(50 + random.random() * 30, 1),
                occupancy_current=_get_occupancy(cfg, hour),
                occupancy_total=cfg["occupancy_total"],
                device_count=cfg["device_count"],
                status=status,
                category=cfg["category"],
                recorded_at=now.isoformat(),
            )
            rows.append(row)

            # ── Alert generation ──────────────────────────────────────────
            prev = self._prev_status[name]
            alert: Optional[AlertEvent] = None

            if prev != status:
                if status == "Critical":
                    alert = AlertEvent(
                        id=str(uuid.uuid4()), zone_name=name,
                        alert_type="power_threshold", severity="critical",
                        message=f"{name} exceeded critical threshold at {new_power} kW — immediate attention required",
                        resolved=False, created_at=now,
                    )
                elif status == "Warning":
                    alert = AlertEvent(
                        id=str(uuid.uuid4()), zone_name=name,
                        alert_type="power_threshold", severity="warning",
                        message=f"{name} power approaching threshold at {new_power} kW",
                        resolved=False, created_at=now,
                    )
                elif status == "Normal" and prev != "Normal":
                    alert = AlertEvent(
                        id=str(uuid.uuid4()), zone_name=name,
                        alert_type="power_threshold", severity="info",
                        message=f"{name} returned to normal operating range ({new_power} kW)",
                        resolved=True, created_at=now,
                    )
                self._prev_status[name] = status
            elif random.random() < 0.25:
                events = [
                    f"{name} diagnostic ping successful.",
                    f"{name} cooling efficiency optimized by 1.2%.",
                    f"Minor voltage fluctuation normalized in {name}.",
                    f"{name} active endpoints verified.",
                    f"Routine check: {name} telemetry stable at {new_power} kW",
                ]
                alert = AlertEvent(
                    id=str(uuid.uuid4()), zone_name=name,
                    alert_type="system_event", severity="info",
                    message=random.choice(events),
                    resolved=True, created_at=now,
                )

            if alert:
                for cb in self._alert_callbacks:
                    try:
                        cb(alert)
                    except Exception:
                        pass

        # ── Update in-memory stores ───────────────────────────────────────
        self.current_readings = rows
        self.history.extend(rows)

        # ── Persist to Supabase (best-effort, non-blocking) ───────────────
        asyncio.create_task(self._persist(rows))

    @staticmethod
    async def _persist(rows: List[dict]) -> None:
        try:
            db = get_supabase()
            db.table("zone_readings").insert(rows).execute()
        except Exception:
            pass   # Never crash the simulator on DB errors


# ── Module-level singleton ────────────────────────────────────────────────────
simulator = DataSimulator()
