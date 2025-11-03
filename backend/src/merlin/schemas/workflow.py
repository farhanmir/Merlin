"""Pydantic schemas for workflow API requests and responses."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# Enums (matching database models)
class WorkflowStatusEnum(str, Enum):
    """Workflow execution status."""

    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepStatusEnum(str, Enum):
    """Individual step execution status."""

    PENDING = "pending"
    RUNNING = "running"
    WAITING_APPROVAL = "waiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class StepTypeEnum(str, Enum):
    """Type of workflow step."""

    PLAN = "plan"
    DRAFT = "draft"
    VERIFY = "verify"
    HUMANIZE = "humanize"
    INTEGRITY_CHECK = "integrity_check"
    AI_DETECTION = "ai_detection"
    CUSTOM = "custom"


# Request Schemas
class CreateWorkflowRequest(BaseModel):
    """Request to create a new workflow."""

    name: str = Field(..., description="Workflow name", min_length=1, max_length=255)
    goal: str = Field(..., description="User's objective", min_length=1)
    description: str | None = Field(None, description="Optional workflow description")
    config: dict = Field(default_factory=dict, description="Workflow configuration")


class CreateStepRequest(BaseModel):
    """Request to add a step to a workflow."""

    step_index: int = Field(..., description="Step order index", ge=0)
    step_type: StepTypeEnum = Field(..., description="Type of step")
    name: str = Field(..., description="Step name", min_length=1, max_length=255)
    description: str | None = Field(None, description="Step description")
    model: str | None = Field(None, description="LLM model to use")
    techniques: list[str] = Field(
        default_factory=list, description="OptiLLM techniques"
    )
    parameters: dict = Field(
        default_factory=dict, description="Step-specific parameters"
    )
    requires_approval: bool = Field(
        False, description="Whether step requires user approval"
    )
    approval_prompt: str | None = Field(
        None, description="Prompt shown at approval gate"
    )


class ApproveStepRequest(BaseModel):
    """Request to approve/reject a step."""

    approved: bool = Field(..., description="Whether step is approved")
    feedback: str | None = Field(None, description="Optional user feedback")


class UpdateWorkflowStatusRequest(BaseModel):
    """Request to update workflow status."""

    status: WorkflowStatusEnum = Field(..., description="New workflow status")
    error_message: str | None = Field(None, description="Error message if failed")


# Response Schemas
class WorkflowStepResponse(BaseModel):
    """Workflow step response."""

    id: int
    workflow_id: int
    step_index: int
    step_type: str
    name: str
    description: str | None
    model: str | None
    techniques: list[str]
    parameters: dict
    requires_approval: bool
    approval_prompt: str | None
    status: str
    input_prompt: str | None
    output: str | None
    user_feedback: str | None
    execution_time_ms: int | None
    token_count: int | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    class Config:
        from_attributes = True


class WorkflowResponse(BaseModel):
    """Workflow response."""

    id: int
    name: str
    description: str | None
    goal: str
    status: str
    current_step_index: int
    config: dict
    result: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    steps: list[WorkflowStepResponse] = []

    class Config:
        from_attributes = True


class WorkflowListResponse(BaseModel):
    """List of workflows."""

    workflows: list[WorkflowResponse]
    total: int
