"""Chatbot router."""
from fastapi import APIRouter
from schemas.models import ChatRequest, ChatResponse
from services.chatbot import get_quick_replies, send_chat_message

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Accept a chat history + new user message and return the assistant's reply.
    Builds a live-data system prompt (zones, alerts, maintenance, weather)
    then calls Groq LLM.
    """
    reply = await send_chat_message(
        history=req.history,
        user_message=req.user_message,
        current_page=req.current_page or "/",
        user_role=req.user_role or "Staff",
    )
    return ChatResponse(reply=reply)


@router.get("/quick-replies", response_model=list[str])
def quick_replies(page: str = "/"):
    """Return context-aware quick-reply suggestions for the given frontend page."""
    return get_quick_replies(page)
