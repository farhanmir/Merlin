"""Workflow database models for agentic multi-step task execution."""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from merlin.db.models import Base
from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


def _utc_now():
    """Helper function for timezone-aware datetime defaults in SQLAlchemy."""
    return datetime.now(timezone.utc)


class WorkflowStatus(str, PyEnum):
    """Workflow execution status."""

    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepStatus(str, PyEnum):
    """Individual step execution status."""

    PENDING = "pending"
    RUNNING = "running"
    WAITING_APPROVAL = "waiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class StepType(str, PyEnum):
    """Type of workflow step."""

    PLAN = "plan"
    DRAFT = "draft"
    VERIFY = "verify"
    HUMANIZE = "humanize"
    INTEGRITY_CHECK = "integrity_check"
    AI_DETECTION = "ai_detection"
    CUSTOM = "custom"


class Workflow(Base):
    """
    Workflow definition and execution state.

    Represents a multi-step agentic task (e.g., essay writing with planning,
    drafting, verification, humanization, and quality checks).
    """

    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User goal/objective
    goal: Mapped[str] = mapped_column(Text, nullable=False)

    # Execution state
    status: Mapped[WorkflowStatus] = mapped_column(
        Enum(WorkflowStatus),
        default=WorkflowStatus.PENDING,
        nullable=False,
    )

    # Current step being executed
    current_step_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Workflow configuration (JSON)
    # Stores: default models, techniques, approval gates, etc.
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Final output
    result: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Error information if failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now, onupdate=_utc_now, nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    steps: Mapped[list["WorkflowStep"]] = relationship(
        "WorkflowStep",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_index",
    )


class WorkflowStep(Base):
    """
    Individual step within a workflow.

    Each step represents a discrete task (e.g., "Generate essay plan",
    "Draft introduction", "Humanize text") with its own model, techniques,
    and approval requirements.
    """

    __tablename__ = "workflow_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )

    # Step metadata
    step_index: Mapped[int] = mapped_column(Integer, nullable=False)
    step_type: Mapped[StepType] = mapped_column(Enum(StepType), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Execution configuration
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    techniques: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Step-specific parameters (JSON)
    # e.g., {"word_count": 500, "tone": "academic", "include_citations": true}
    parameters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Approval gate configuration
    requires_approval: Mapped[bool] = mapped_column(default=False, nullable=False)
    approval_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Execution state
    status: Mapped[StepStatus] = mapped_column(
        Enum(StepStatus),
        default=StepStatus.PENDING,
        nullable=False,
    )

    # Input prompt sent to LLM
    input_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Output from LLM
    output: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User feedback/modifications
    user_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Performance metrics
    execution_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Error information
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now, nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="steps")
