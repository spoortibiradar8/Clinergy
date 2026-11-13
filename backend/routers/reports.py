"""Reports router — server-side PDF generation via ReportLab."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response

from schemas.models import ReportRequest
from services.pdf_service import generate_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/pdf")
def export_pdf(req: ReportRequest):
    """
    Generate and stream a PDF compliance report.
    Replaces the client-side jsPDF implementation entirely.

    Body fields:
    - start_date: ISO date string (e.g. "2025-05-01")
    - end_date:   ISO date string (e.g. "2025-05-18")
    - zones:      Optional list of zone names to include (None = all)
    - include_ai: Include AI forecast section (default: true)
    - include_maintenance: Include maintenance table (default: true)
    """
    pdf_bytes = generate_report_pdf(
        start_date=req.start_date,
        end_date=req.end_date,
        zones=req.zones,
        include_ai=req.include_ai,
        include_maintenance=req.include_maintenance,
    )

    filename = f"clinergy_report_{req.start_date}_to_{req.end_date}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
