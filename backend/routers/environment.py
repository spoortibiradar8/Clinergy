"""Weather & carbon router."""
from fastapi import APIRouter, Query
from schemas.models import CarbonResponse, WeatherResponse
from services.carbon_service import get_carbon_summary
from services.weather_service import fetch_weather

router = APIRouter(prefix="/environment", tags=["environment"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather():
    """
    Fetch current Bengaluru weather from Open-Meteo.
    Response is cached for 10 minutes.
    Includes HVAC cooling load impact calculation.
    """
    return await fetch_weather()


@router.get("/carbon", response_model=CarbonResponse)
def get_carbon(energy_kwh: float = Query(..., ge=0, description="Total energy in kWh")):
    """
    Calculate carbon emissions for a given energy consumption.
    Returns kg CO₂, trees-to-offset count, compliance cost (INR),
    and current Karnataka grid carbon intensity.
    """
    return get_carbon_summary(energy_kwh)
