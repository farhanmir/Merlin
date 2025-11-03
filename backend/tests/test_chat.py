import pytest
from fastapi.testclient import TestClient


def test_list_models_no_keys(test_client: TestClient) -> None:
    """Test listing models with no API keys configured."""
    response = test_client.get("/api/v1/chat/models")
    
    assert response.status_code == 200
    data = response.json()
    assert data["models"] == []


def test_list_models_with_keys(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test listing models with API keys configured."""
    # Add a key first
    async def mock_validate(*args, **kwargs):
        return True
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "sk-test-key-123456789"},
    )
    
    # Now list models
    response = test_client.get("/api/v1/chat/models")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) > 0
    assert any(m["provider"] == "OpenAI" for m in data["models"])


def test_chat_completion_no_stream(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test chat completion without streaming."""
    # Add a key first
    async def mock_validate(*args, **kwargs):
        return True
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    # Mock OptiLLM response
    async def mock_chat_completion(*args, **kwargs):
        return {
            "id": "test-123",
            "model": "gpt-4o",
            "choices": [
                {
                    "message": {"role": "assistant", "content": "Hello!"},
                    "finish_reason": "stop",
                }
            ],
        }
    
    monkeypatch.setattr(
        "merlin.services.optillm_service.OptiLLMService.chat_completion",
        mock_chat_completion,
    )
    
    test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "sk-test-key-123456789"},
    )
    
    # Send chat request
    response = test_client.post(
        "/api/v1/chat/completions",
        json={
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "Hello"}],
            "stream": False,
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "choices" in data


def test_chat_with_techniques(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test chat with OptiLLM techniques."""
    # Add a key first
    async def mock_validate(*args, **kwargs):
        return True
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    # Track the model name sent to OptiLLM
    captured_model = None
    
    async def mock_chat_completion(self, model, *args, **kwargs):
        nonlocal captured_model
        captured_model = model
        return {
            "id": "test-123",
            "model": model,
            "choices": [{"message": {"role": "assistant", "content": "Response"}}],
        }
    
    monkeypatch.setattr(
        "merlin.services.optillm_service.OptiLLMService.chat_completion",
        mock_chat_completion,
    )
    
    test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "sk-test-key-123456789"},
    )
    
    # Send chat request with techniques
    response = test_client.post(
        "/api/v1/chat/completions",
        json={
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "Hello"}],
            "techniques": ["plansearch", "cot_reflection"],
            "stream": False,
        },
    )
    
    assert response.status_code == 200
    # Note: In actual implementation, OptiLLM service would modify model name
