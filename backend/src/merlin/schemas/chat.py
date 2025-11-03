from typing import Literal, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    """Chat message model."""

    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    """Request model for chat completions."""

    model: str = Field(..., description="Model ID to use")
    messages: list[Message] = Field(..., min_length=1, description="Conversation messages")
    techniques: list[str] = Field(
        default_factory=list,
        description="OptiLLM techniques to apply (e.g., ['plansearch', 'cot_reflection'])",
    )
    stream: bool = Field(default=True, description="Whether to stream the response")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=None, description="Maximum tokens to generate")


class ChatResponse(BaseModel):
    """Response model for non-streaming chat completions."""

    id: str
    model: str
    choices: list[dict]
    usage: Optional[dict] = None


class ModelInfo(BaseModel):
    """Information about an available model."""

    id: str
    name: str
    provider: str


class ModelList(BaseModel):
    """List of available models."""

    models: list[ModelInfo]
