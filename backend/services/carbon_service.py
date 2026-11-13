"""
ClinErgy Carbon Service — Python port of carbonService.js
Calculates carbon emissions and grid carbon intensity for the
India Southern Grid (Karnataka).
"""
from __future__ import annotations

from datetime import datetime, timezone

from schemas.models import CarbonEmissions, CarbonResponse, GridCarbonStatus

# India Southern Grid emission factor (kg CO₂ per kWh)
_EMISSION_FACTOR = 0.82

# Carbon offset by one mature tree per year (kg CO₂)
_TREE_OFFSET_KG = 21.7

# Carbon compliance cost (INR per kg CO₂)
_CARBON_COST_PER_KG = 0.15


def calculate_carbon_emissions(energy_kwh: float) -> CarbonEmissions:
    """Return carbon footprint for a given energy consumption (kWh)."""
    kwh = max(0.0, energy_kwh)
    carbon_kg_raw = kwh * _EMISSION_FACTOR
    carbon_kg = round(carbon_kg_raw, 2)
    carbon_trees = round(carbon_kg_raw / _TREE_OFFSET_KG)
    carbon_cost = round(carbon_kg_raw * _CARBON_COST_PER_KG, 2)
    return CarbonEmissions(
        carbon_kg=carbon_kg,
        carbon_trees=carbon_trees,
        carbon_cost=carbon_cost,
    )


def get_grid_carbon_status(hour: int | None = None) -> GridCarbonStatus:
    """
    Return current carbon intensity of the Karnataka grid based on
    time-of-day (coal vs. solar vs. off-peak mix).
    """
    h = hour if hour is not None else datetime.now(timezone.utc).hour
    # Convert UTC to IST (+5:30) for local hour
    ist_hour = (h + 5) % 24  # approximate; good enough for tariff logic

    if 6 <= ist_hour < 9:
        return GridCarbonStatus(intensity="High", g_co2_per_kwh=950,
                                reason="Morning peak demand, coal-heavy grid")
    if 9 <= ist_hour < 15:
        return GridCarbonStatus(intensity="Medium", g_co2_per_kwh=750,
                                reason="Solar generation offsetting coal")
    if 15 <= ist_hour < 18:
        return GridCarbonStatus(intensity="Low", g_co2_per_kwh=580,
                                reason="Peak solar hours — greenest window")
    if 18 <= ist_hour < 21:
        return GridCarbonStatus(intensity="High", g_co2_per_kwh=920,
                                reason="Evening peak, solar gone, coal dominates")
    return GridCarbonStatus(intensity="Medium", g_co2_per_kwh=720,
                            reason="Night load, moderate carbon intensity")


def get_carbon_summary(energy_kwh: float) -> CarbonResponse:
    """Convenience wrapper that bundles emissions + grid status."""
    return CarbonResponse(
        emissions=calculate_carbon_emissions(energy_kwh),
        grid_status=get_grid_carbon_status(),
        last_updated=datetime.now(timezone.utc),
    )
