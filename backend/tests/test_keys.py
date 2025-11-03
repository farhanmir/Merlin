import pytest
from fastapi.testclient import TestClient


def test_add_valid_key(test_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test adding a valid API key."""
    # Mock the validation call to return success
    async def mock_validate(*args, **kwargs):
        return True
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    response = test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "sk-test-key-123456789"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "openai"
    assert data["is_valid"] is True
    assert "masked_key" in data


def test_add_invalid_key(test_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test adding an invalid API key."""
    # Mock the validation call to return failure
    async def mock_validate(*args, **kwargs):
        return False
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    response = test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "invalid-key"},
    )
    
    assert response.status_code == 400
    assert "Invalid API key" in response.json()["detail"]


def test_list_keys(test_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test listing configured API keys."""
    # First, add a key
    async def mock_validate(*args, **kwargs):
        return True
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "sk-test-key-123456789"},
    )
    
    # Now list keys
    response = test_client.get("/api/v1/keys")
    
    assert response.status_code == 200
    data = response.json()
    assert "keys" in data
    assert len(data["keys"]) > 0
    assert data["keys"][0]["provider"] == "openai"


def test_delete_key(test_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test deleting an API key."""
    # First, add a key
    async def mock_validate(*args, **kwargs):
        return True
    
    monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
    
    test_client.post(
        "/api/v1/keys",
        json={"provider": "openai", "api_key": "sk-test-key-123456789"},
    )
    
    # Now delete it
    response = test_client.delete("/api/v1/keys/openai")
    
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]
    
    # Verify it's gone
    list_response = test_client.get("/api/v1/keys")
    assert len(list_response.json()["keys"]) == 0
