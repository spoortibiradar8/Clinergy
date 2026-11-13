"""AI Insights router."""
from fastapi import APIRouter
from schemas.models import AIInsightsResponse
from services.ai_insights import generate_insights

router = APIRouter(prefix="/ai-insights", tags=["ai-insights"])


@router.get("/", response_model=AIInsightsResponse)
async def get_insights():
    """
    Return AI-generated 7-day energy forecast and recommendations.
    Primary: Groq LLM with live Supabase data.
    Fallback: Scikit-Learn linear regression model.
    Result is cached for 5 minutes.
    """
    return await generate_insights()
