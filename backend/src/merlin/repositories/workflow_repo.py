"""Repository for workflow database operations."""

from datetime import datetime, timezone

from merlin.db.workflow_models import Workflow, WorkflowStatus, WorkflowStep
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class WorkflowRepository:
    """Repository for managing workflows and their steps."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        name: str,
        goal: str,
        description: str | None = None,
        config: dict | None = None,
    ) -> Workflow:
        """
        Create a new workflow.

        Args:
            name: Workflow name (e.g., "Essay Writer")
            goal: User's objective (e.g., "Write 500-word essay on American Revolution")
            description: Optional workflow description
            config: Optional configuration dict

        Returns:
            Created workflow instance
        """
        workflow = Workflow(
            name=name,
            goal=goal,
            description=description,
            config=config or {},
            status=WorkflowStatus.PENDING,
            current_step_index=0,
        )
        self.session.add(workflow)
        await self.session.commit()
        await self.session.refresh(workflow)
        return workflow

    async def get_by_id(self, workflow_id: int) -> Workflow | None:
        """
        Get workflow by ID with all steps loaded.

        Args:
            workflow_id: Workflow ID

        Returns:
            Workflow instance or None if not found
        """
        stmt = (
            select(Workflow)
            .where(Workflow.id == workflow_id)
            .options(selectinload(Workflow.steps))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        status: WorkflowStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Workflow]:
        """
        Get all workflows with optional filtering.

        Args:
            status: Filter by workflow status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of workflows
        """
        stmt = select(Workflow).options(selectinload(Workflow.steps))

        if status:
            stmt = stmt.where(Workflow.status == status)

        stmt = stmt.order_by(Workflow.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_status(
        self,
        workflow_id: int,
        status: WorkflowStatus,
        error_message: str | None = None,
    ) -> Workflow | None:
        """
        Update workflow status.

        Args:
            workflow_id: Workflow ID
            status: New status
            error_message: Optional error message if failed

        Returns:
            Updated workflow or None if not found
        """
        workflow = await self.get_by_id(workflow_id)
        if not workflow:
            return None

        workflow.status = status
        workflow.updated_at = datetime.now(timezone.utc)

        if status == WorkflowStatus.RUNNING and not workflow.started_at:
            workflow.started_at = datetime.now(timezone.utc)
        elif status in [
            WorkflowStatus.COMPLETED,
            WorkflowStatus.FAILED,
            WorkflowStatus.CANCELLED,
        ]:
            workflow.completed_at = datetime.now(timezone.utc)

        if error_message:
            workflow.error_message = error_message

        await self.session.commit()
        await self.session.refresh(workflow)
        return workflow

    async def advance_step(self, workflow_id: int) -> Workflow | None:
        """
        Advance workflow to next step.

        Args:
            workflow_id: Workflow ID

        Returns:
            Updated workflow or None if not found
        """
        workflow = await self.get_by_id(workflow_id)
        if not workflow:
            return None

        workflow.current_step_index += 1
        workflow.updated_at = datetime.now(timezone.utc)

        # Check if workflow is complete
        if workflow.current_step_index >= len(workflow.steps):
            workflow.status = WorkflowStatus.COMPLETED
            workflow.completed_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(workflow)
        return workflow

    async def add_step(
        self,
        workflow_id: int,
        step: WorkflowStep,
    ) -> WorkflowStep:
        """
        Add a step to a workflow.

        Args:
            workflow_id: Workflow ID
            step: WorkflowStep instance

        Returns:
            Created step
        """
        step.workflow_id = workflow_id
        self.session.add(step)
        await self.session.commit()
        await self.session.refresh(step)
        return step

    async def delete(self, workflow_id: int) -> bool:
        """
        Delete a workflow and all its steps.

        Args:
            workflow_id: Workflow ID

        Returns:
            True if deleted, False if not found
        """
        workflow = await self.get_by_id(workflow_id)
        if not workflow:
            return False

        await self.session.delete(workflow)
        await self.session.commit()
        return True
