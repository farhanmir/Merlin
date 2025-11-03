"""Workflow API endpoints for agentic multi-step task execution."""

from fastapi import APIRouter, Depends, HTTPException
from merlin.api.deps import ExternalAPIDep, get_session
from merlin.db.workflow_models import StepType, WorkflowStep
from merlin.repositories.workflow_repo import WorkflowRepository
from merlin.schemas.workflow import (
    ApproveStepRequest,
    CreateStepRequest,
    CreateWorkflowRequest,
    UpdateWorkflowStatusRequest,
    WorkflowListResponse,
    WorkflowResponse,
)
from merlin.services.external_api_service import ExternalAPIService
from merlin.services.optillm_service import OptiLLMService
from merlin.services.workflow_service import WorkflowOrchestrator
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


def get_workflow_repo(
    session: AsyncSession = Depends(get_session),
) -> WorkflowRepository:
    """Dependency to get workflow repository."""
    return WorkflowRepository(session)


def get_optillm_service() -> OptiLLMService:
    """Dependency to get OptiLLM service."""
    from merlin.core.config import get_settings

    settings = get_settings()
    return OptiLLMService(settings.optillm_url)


def get_workflow_orchestrator(
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
    optillm_service: OptiLLMService = Depends(get_optillm_service),
    external_api_service: ExternalAPIService = Depends(ExternalAPIDep),
) -> WorkflowOrchestrator:
    """Dependency to get workflow orchestrator."""
    return WorkflowOrchestrator(workflow_repo, optillm_service, external_api_service)


@router.post("/workflows", response_model=WorkflowResponse, status_code=201)
async def create_workflow(
    request: CreateWorkflowRequest,
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> WorkflowResponse:
    """Create a new workflow."""
    workflow = await workflow_repo.create(
        name=request.name,
        goal=request.goal,
        description=request.description,
        config=request.config,
    )
    return WorkflowResponse.model_validate(workflow)


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> WorkflowResponse:
    """Get workflow by ID."""
    workflow = await workflow_repo.get_by_id(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse.model_validate(workflow)


@router.get("/workflows", response_model=WorkflowListResponse)
async def list_workflows(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> WorkflowListResponse:
    """List all workflows with optional filtering."""
    workflows = await workflow_repo.get_all(
        status=status,  # type: ignore
        limit=limit,
        offset=offset,
    )
    return WorkflowListResponse(
        workflows=[WorkflowResponse.model_validate(w) for w in workflows],
        total=len(workflows),
    )


@router.post(
    "/workflows/{workflow_id}/steps", response_model=WorkflowResponse, status_code=201
)
async def add_workflow_step(
    workflow_id: int,
    request: CreateStepRequest,
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> WorkflowResponse:
    """Add a step to a workflow."""
    # Verify workflow exists
    workflow = await workflow_repo.get_by_id(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Create step
    step = WorkflowStep(
        workflow_id=workflow_id,
        step_index=request.step_index,
        step_type=StepType(request.step_type.value),  # type: ignore
        name=request.name,
        description=request.description,
        model=request.model,
        techniques=request.techniques,
        parameters=request.parameters,
        requires_approval=request.requires_approval,
        approval_prompt=request.approval_prompt,
    )

    await workflow_repo.add_step(workflow_id, step)

    # Return updated workflow
    workflow = await workflow_repo.get_by_id(workflow_id)
    return WorkflowResponse.model_validate(workflow)


@router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: int,
    orchestrator: WorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> dict:
    """Execute a workflow from current step."""
    result = await orchestrator.execute_workflow(workflow_id)
    return result


@router.post("/workflows/{workflow_id}/steps/{step_index}/approve")
async def approve_step(
    workflow_id: int,
    step_index: int,
    request: ApproveStepRequest,
    orchestrator: WorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> dict:
    """Approve or reject a step at approval gate."""
    result = await orchestrator.approve_step(
        workflow_id=workflow_id,
        step_index=step_index,
        approved=request.approved,
        feedback=request.feedback,
    )
    return result


@router.patch("/workflows/{workflow_id}/status", response_model=WorkflowResponse)
async def update_workflow_status(
    workflow_id: int,
    request: UpdateWorkflowStatusRequest,
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> WorkflowResponse:
    """Update workflow status (pause, cancel, etc.)."""
    workflow = await workflow_repo.update_status(
        workflow_id=workflow_id,
        status=request.status,  # type: ignore
        error_message=request.error_message,
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse.model_validate(workflow)


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: int,
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> None:
    """Delete a workflow and all its steps."""
    success = await workflow_repo.delete(workflow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found")


@router.post(
    "/workflows/templates/essay-writer",
    response_model=WorkflowResponse,
    status_code=201,
)
async def create_essay_workflow_from_template(
    goal: str,
    word_count: int = 500,
    style: str = "academic",
    workflow_repo: WorkflowRepository = Depends(get_workflow_repo),
) -> WorkflowResponse:
    """Create an Essay Writer workflow from template."""
    from merlin.workflows import create_essay_workflow

    requirements = {
        "word_count": word_count,
        "style": style,
    }

    workflow = await create_essay_workflow(
        workflow_repo=workflow_repo,
        goal=goal,
        requirements=requirements,
    )

    return WorkflowResponse.model_validate(workflow)
