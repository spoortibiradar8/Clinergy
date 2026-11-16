"""
Unit tests for the ClinErgy Chatbot service and API endpoints.
"""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from config import settings
from routers import chatbot
from schemas.models import ChatMessage
from services.chatbot import get_quick_replies, send_chat_message

app = FastAPI()
app.include_router(chatbot.router)
client = TestClient(app)


# ── Test 1: Quick replies format and fallback ────────────────────────────────

def test_quick_replies_response_format():
    """Verify quick-replies returns a list of strings for known and unknown pages."""
    home_replies = get_quick_replies("/")
    assert isinstance(home_replies, list)
    assert len(home_replies) > 0
    assert all(isinstance(item, str) for item in home_replies)
    assert "Which zone uses most energy?" in home_replies

    # Fallback for unregistered route
    fallback_replies = get_quick_replies("/unknown-route")
    assert isinstance(fallback_replies, list)
    assert "What's the current energy status?" in fallback_replies


# ── Test 2: Unconfigured / empty API key handling ────────────────────────────

def test_send_chat_message_unconfigured_api_key():
    """When GROQ_API_KEY is unset or empty, the assistant returns a graceful fallback message."""
    with patch.object(settings, "groq_api_key", ""):
        reply = asyncio.run(
            send_chat_message(
                history=[],
                user_message="What is the ICU power usage?",
                current_page="/",
                user_role="Energy Manager",
            )
        )
        assert isinstance(reply, str)
        assert "AI not configured" in reply


# ── Test 3: Successful LLM response format with mocked API ───────────────────

def test_send_chat_message_success_response_format():
    """Verify response format and content extraction when Groq returns 200 OK."""
    fake_response = MagicMock()
    fake_response.raise_for_status = MagicMock()
    fake_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": "**ICU power usage** is currently **42.5 kW**, which is within normal limits."
                }
            }
        ]
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = fake_response
    mock_client_context = AsyncMock()
    mock_client_context.__aenter__.return_value = mock_client
    mock_client_context.__aexit__.return_value = None

    with patch.object(settings, "groq_api_key", "gsk_test_api_key"):
        with patch("services.chatbot._build_system_prompt", new=AsyncMock(return_value="System prompt")):
            with patch("httpx.AsyncClient", return_value=mock_client_context):
                reply = asyncio.run(
                    send_chat_message(
                        history=[ChatMessage(role="user", content="Hello")],
                        user_message="What is the ICU status?",
                        current_page="/zones",
                        user_role="Zone Manager",
                    )
                )

                assert isinstance(reply, str)
                assert "42.5 kW" in reply
                mock_client.post.assert_called_once()


# ── Test 4: External API error handling ──────────────────────────────────────

def test_send_chat_message_api_error_case():
    """Verify graceful error recovery when the external API throws a 401 or network error."""
    mock_client = AsyncMock()
    mock_client.post.side_effect = Exception("401 Unauthorized: Invalid API key")
    mock_client_context = AsyncMock()
    mock_client_context.__aenter__.return_value = mock_client
    mock_client_context.__aexit__.return_value = None

    with patch.object(settings, "groq_api_key", "gsk_invalid_key"):
        with patch("services.chatbot._build_system_prompt", new=AsyncMock(return_value="System prompt")):
            with patch("httpx.AsyncClient", return_value=mock_client_context):
                reply = asyncio.run(
                    send_chat_message(
                        history=[],
                        user_message="Show alerts",
                        current_page="/alerts",
                        user_role="Admin",
                    )
                )

                assert isinstance(reply, str)
                assert "Invalid API key" in reply


# ── Test 5: FastAPI Router integration ───────────────────────────────────────

def test_chatbot_router_endpoints():
    """Verify the FastAPI HTTP routes /chatbot/quick-replies and /chatbot/message."""
    # Test GET quick-replies
    resp = client.get("/chatbot/quick-replies?page=/live")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert "Real-time power summary" in data

    # Test POST message with mocked service
    with patch("routers.chatbot.send_chat_message", new=AsyncMock(return_value="Mocked assistant response")):
        post_resp = client.post(
            "/chatbot/message",
            json={
                "history": [],
                "user_message": "Tell me about power consumption",
                "current_page": "/",
                "user_role": "Energy Manager",
            },
        )
        assert post_resp.status_code == 200
        result = post_resp.json()
        assert result == {"reply": "Mocked assistant response"}
