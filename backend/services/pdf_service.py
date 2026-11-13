"""
ClinErgy PDF Report Service
Generates a professional multi-page PDF compliance report using ReportLab.
Replaces the client-side jsPDF implementation entirely — no browser required.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from database.connection import get_supabase
from services.carbon_service import calculate_carbon_emissions, get_grid_carbon_status

# ── Brand colours ─────────────────────────────────────────────────────────────
_TEAL      = colors.HexColor("#0d9488")
_TEAL_DARK = colors.HexColor("#0f766e")
_SLATE     = colors.HexColor("#1e293b")
_MUTED     = colors.HexColor("#64748b")
_WHITE     = colors.white
_LIGHT_BG  = colors.HexColor("#f8fafc")
_WARN      = colors.HexColor("#f59e0b")
_CRIT      = colors.HexColor("#ef4444")
_OK        = colors.HexColor("#10b981")


def _get_status_color(status: str) -> colors.Color:
    if status == "Critical": return _CRIT
    if status == "Warning":  return _WARN
    return _OK


# ── Data fetchers ─────────────────────────────────────────────────────────────

def _fetch_readings(start: str, end: str, zones: Optional[list[str]]) -> list[dict]:
    try:
        db = get_supabase()
        q = (
            db.table("zone_readings")
            .select("zone_name,power_kw,energy_kwh_today,temperature,status,category,recorded_at")
            .gte("recorded_at", start)
            .lte("recorded_at", end)
            .order("recorded_at", desc=False)
            .limit(500)
        )
        if zones:
            q = q.in_("zone_name", zones)
        return q.execute().data or []
    except Exception:
        return []


def _fetch_maintenance(start: str, end: str) -> list[dict]:
    try:
        db = get_supabase()
        resp = (
            db.table("maintenance_schedules")
            .select("equipment_id,technician_name,scheduled_date,status")
            .gte("scheduled_date", start)
            .lte("scheduled_date", end)
            .limit(50)
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
            .select("forecast_kwh,estimated_cost_inr,confidence_percent,at_risk_zone,recommendation,savings_inr")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return (resp.data or [None])[0]
    except Exception:
        return None


# ── PDF builder ───────────────────────────────────────────────────────────────

def generate_report_pdf(
    start_date: str,
    end_date: str,
    zones: Optional[list[str]] = None,
    include_ai: bool = True,
    include_maintenance: bool = True,
) -> bytes:
    """
    Build and return a complete PDF compliance report as raw bytes.
    The caller streams these bytes to the HTTP response.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title="ClinErgy Energy Report",
    )

    styles = getSampleStyleSheet()
    story: list = []

    # ── Styles ────────────────────────────────────────────────────────────────
    h1 = ParagraphStyle("H1", fontSize=22, textColor=_TEAL_DARK,
                        spaceAfter=4, fontName="Helvetica-Bold", alignment=TA_LEFT)
    h2 = ParagraphStyle("H2", fontSize=14, textColor=_SLATE,
                        spaceAfter=4, fontName="Helvetica-Bold", spaceBefore=10)
    h3 = ParagraphStyle("H3", fontSize=11, textColor=_MUTED,
                        spaceAfter=2, fontName="Helvetica-Bold")
    body = ParagraphStyle("Body", fontSize=9, textColor=_SLATE,
                          spaceAfter=2, fontName="Helvetica", leading=14)
    caption = ParagraphStyle("Caption", fontSize=8, textColor=_MUTED,
                              alignment=TA_CENTER, fontName="Helvetica-Oblique")
    right_p = ParagraphStyle("Right", fontSize=9, textColor=_MUTED,
                              alignment=TA_RIGHT, fontName="Helvetica")

    # ── Cover Page ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 30 * mm))
    story.append(Paragraph("⚡ CLINERGY", h1))
    story.append(Paragraph("Clinical Energy &amp; Asset Management Platform", h2))
    story.append(HRFlowable(width="100%", thickness=2, color=_TEAL, spaceAfter=6))
    story.append(Paragraph(f"<b>Energy Compliance Report</b>", h2))
    story.append(Paragraph(f"Period: <b>{start_date}</b> to <b>{end_date}</b>", body))
    story.append(Paragraph(
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        right_p,
    ))
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(
        "This report summarises energy consumption, zone status, carbon footprint, "
        "AI demand forecasts, and maintenance activity for the selected period. "
        "All data is sourced directly from live IoT sensor streams via the "
        "ClinErgy Supabase telemetry database.",
        body,
    ))
    story.append(PageBreak())

    # ── Fetch data ────────────────────────────────────────────────────────────
    readings   = _fetch_readings(start_date, end_date, zones)
    maintenance_recs = _fetch_maintenance(start_date, end_date) if include_maintenance else []
    prediction = _fetch_latest_prediction() if include_ai else None

    # ── Zone Summary Section ──────────────────────────────────────────────────
    story.append(Paragraph("1. Zone Energy Summary", h2))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))

    if readings:
        # Aggregate per zone
        zone_agg: dict[str, dict] = {}
        for r in readings:
            n = r["zone_name"]
            if n not in zone_agg:
                zone_agg[n] = dict(
                    zone=n, category=r.get("category", ""),
                    total_kwh=0.0, count=0, total_power=0.0,
                    max_power=0.0, statuses=[]
                )
            zone_agg[n]["total_kwh"]  += r.get("energy_kwh_today", 0) or 0
            zone_agg[n]["count"]      += 1
            pwr = r.get("power_kw", 0) or 0
            zone_agg[n]["total_power"] += pwr
            zone_agg[n]["max_power"]   = max(zone_agg[n]["max_power"], pwr)
            zone_agg[n]["statuses"].append(r.get("status", "Normal"))

        tbl_data = [["Zone", "Category", "Avg kW", "Peak kW", "Total kWh", "Dominant Status"]]
        total_kwh_all = 0.0
        for v in zone_agg.values():
            avg_pwr  = round(v["total_power"] / v["count"], 1) if v["count"] else 0
            peak_pwr = round(v["max_power"], 1)
            kwh      = round(v["total_kwh"] / v["count"], 1)   # daily avg
            dominant = max(set(v["statuses"]), key=v["statuses"].count)
            total_kwh_all += kwh
            tbl_data.append([
                v["zone"], v["category"],
                str(avg_pwr), str(peak_pwr), str(kwh), dominant,
            ])

        col_widths = [45*mm, 35*mm, 25*mm, 25*mm, 28*mm, 34*mm]
        tbl = Table(tbl_data, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0),  _TEAL),
            ("TEXTCOLOR",   (0, 0), (-1, 0),  _WHITE),
            ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, 0),  9),
            ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_LIGHT_BG, _WHITE]),
            ("FONTSIZE",    (0, 1), (-1, -1), 8),
            ("GRID",        (0, 0), (-1, -1), 0.4, _MUTED),
            ("TOPPADDING",  (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 4 * mm))

        # Carbon summary
        carbon = calculate_carbon_emissions(total_kwh_all)
        grid   = get_grid_carbon_status()
        story.append(Paragraph("Carbon Footprint Summary", h3))
        story.append(Paragraph(
            f"Total estimated CO₂: <b>{carbon.carbon_kg} kg</b> | "
            f"Trees required to offset: <b>{carbon.carbon_trees}</b> | "
            f"Compliance cost: <b>₹{carbon.carbon_cost}</b> | "
            f"Grid carbon intensity: <b>{grid.intensity}</b> ({grid.g_co2_per_kwh} g CO₂/kWh)",
            body,
        ))
    else:
        story.append(Paragraph("No telemetry readings found for the selected date range.", body))

    story.append(Spacer(1, 6 * mm))

    # ── AI Insights Section ───────────────────────────────────────────────────
    if include_ai and prediction:
        story.append(Paragraph("2. AI Demand Forecast &amp; Recommendations", h2))
        story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))

        ai_data = [
            ["Metric", "Value"],
            ["Forecasted Daily Demand",   f"{prediction.get('forecast_kwh', 'N/A')} kWh"],
            ["Estimated Daily Cost",       f"₹{prediction.get('estimated_cost_inr', 'N/A')}"],
            ["Model Confidence",           f"{prediction.get('confidence_percent', 'N/A')}%"],
            ["At-Risk Zone",               prediction.get('at_risk_zone', 'N/A')],
            ["Potential Daily Savings",    f"₹{prediction.get('savings_inr', 'N/A')}"],
        ]
        ai_tbl = Table(ai_data, colWidths=[80*mm, 92*mm], repeatRows=1)
        ai_tbl.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0),  _TEAL_DARK),
            ("TEXTCOLOR",   (0, 0), (-1, 0),  _WHITE),
            ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_LIGHT_BG, _WHITE]),
            ("GRID",        (0, 0), (-1, -1), 0.4, _MUTED),
            ("TOPPADDING",  (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(ai_tbl)
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(
            f"<b>Recommendation:</b> {prediction.get('recommendation', 'N/A')}", body
        ))
        story.append(Spacer(1, 6 * mm))

    # ── Maintenance Section ───────────────────────────────────────────────────
    if include_maintenance:
        story.append(Paragraph("3. Maintenance Activity", h2))
        story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))

        if maintenance_recs:
            mnt_data = [["Equipment ID", "Technician", "Scheduled Date", "Status"]]
            for m in maintenance_recs:
                mnt_data.append([
                    m.get("equipment_id", ""),
                    m.get("technician_name", ""),
                    str(m.get("scheduled_date", ""))[:10],
                    m.get("status", ""),
                ])
            mnt_tbl = Table(mnt_data, colWidths=[45*mm, 50*mm, 40*mm, 37*mm], repeatRows=1)
            mnt_tbl.setStyle(TableStyle([
                ("BACKGROUND",  (0, 0), (-1, 0),  _TEAL),
                ("TEXTCOLOR",   (0, 0), (-1, 0),  _WHITE),
                ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
                ("FONTSIZE",    (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_LIGHT_BG, _WHITE]),
                ("GRID",        (0, 0), (-1, -1), 0.4, _MUTED),
                ("TOPPADDING",  (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(mnt_tbl)
        else:
            story.append(Paragraph("No maintenance records found for the selected period.", body))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=_MUTED))
    story.append(Paragraph(
        "ClinErgy Clinical Energy &amp; Asset Management Platform — Confidential Report. "
        "Generated by Python ReportLab engine.",
        caption,
    ))

    doc.build(story)
    return buf.getvalue()
