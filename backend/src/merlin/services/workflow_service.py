"""Workflow orchestration service for multi-step agentic task execution."""

from datetime import datetime, timezone

from merlin.db.workflow_models import StepStatus, StepType, WorkflowStatus, WorkflowStep
from merlin.repositories.workflow_repo import WorkflowRepository
from merlin.services.external_api_service import ExternalAPIService
from merlin.services.optillm_service import OptiLLMService


class WorkflowOrchestrator:
    """
    Orchestrates multi-step workflow execution with approval gates.

    Handles:
    - Step-by-step LLM execution
    - User approval gates (pause/resume)
    - Multi-model orchestration
    - State management and error recovery
    """

    def __init__(
        self,
        workflow_repo: WorkflowRepository,
        optillm_service: OptiLLMService,
        external_api_service: ExternalAPIService | None = None,
    ):
        """Initialize orchestrator with dependencies."""
        self.workflow_repo = workflow_repo
        self.optillm_service = optillm_service
        self.external_api_service = external_api_service or ExternalAPIService()

    async def execute_workflow(self, workflow_id: int) -> dict:
        """
        Execute a workflow from current step until completion or approval gate.

        Args:
            workflow_id: Workflow ID to execute

        Returns:
            dict with status and current state
        """
        workflow = await self.workflow_repo.get_by_id(workflow_id)
        if not workflow:
            return {"error": "Workflow not found"}

        # Update status to running
        if workflow.status == WorkflowStatus.PENDING:
            await self.workflow_repo.update_status(workflow_id, WorkflowStatus.RUNNING)
            workflow = await self.workflow_repo.get_by_id(workflow_id)

        # Execute steps sequentially
        while workflow.current_step_index < len(workflow.steps):
            current_step = workflow.steps[workflow.current_step_index]

            # Check if step requires approval and is waiting
            if (
                current_step.requires_approval
                and current_step.status == StepStatus.WAITING_APPROVAL
            ):
                # Pause at approval gate
                await self.workflow_repo.update_status(
                    workflow_id, WorkflowStatus.PAUSED
                )
                return {
                    "status": "paused_for_approval",
                    "workflow_id": workflow_id,
                    "current_step": current_step.step_index,
                    "step_name": current_step.name,
                    "output": current_step.output,
                }

            # Execute current step
            try:
                result = await self._execute_step(workflow_id, current_step)

                if result.get("error"):
                    # Mark workflow as failed
                    await self.workflow_repo.update_status(
                        workflow_id,
                        WorkflowStatus.FAILED,
                        error_message=result["error"],
                    )
                    return {"status": "failed", "error": result["error"]}

                # If step requires approval, pause here
                if current_step.requires_approval:
                    await self._update_step_status(
                        current_step, StepStatus.WAITING_APPROVAL
                    )
                    await self.workflow_repo.update_status(
                        workflow_id, WorkflowStatus.PAUSED
                    )
                    return {
                        "status": "paused_for_approval",
                        "workflow_id": workflow_id,
                        "current_step": current_step.step_index,
                        "step_name": current_step.name,
                        "output": current_step.output,
                    }

                # Mark step as completed and advance
                await self._update_step_status(current_step, StepStatus.COMPLETED)
                workflow = await self.workflow_repo.advance_step(workflow_id)

            except Exception as e:
                error_msg = f"Step execution failed: {str(e)}"
                current_step.status = StepStatus.FAILED
                current_step.error_message = error_msg
                await self.workflow_repo.update_status(
                    workflow_id, WorkflowStatus.FAILED, error_message=error_msg
                )
                return {"status": "failed", "error": error_msg}

        # All steps completed
        await self.workflow_repo.update_status(workflow_id, WorkflowStatus.COMPLETED)
        workflow = await self.workflow_repo.get_by_id(workflow_id)

        # Compile final result from all steps
        final_result = self._compile_results(workflow.steps)
        workflow.result = final_result

        return {
            "status": "completed",
            "workflow_id": workflow_id,
            "result": final_result,
        }

    async def approve_step(
        self,
        workflow_id: int,
        step_index: int,
        approved: bool,
        feedback: str | None = None,
    ) -> dict:
        """
        Approve or reject a step at an approval gate.

        Args:
            workflow_id: Workflow ID
            step_index: Step index to approve/reject
            approved: Whether step is approved
            feedback: Optional user feedback

        Returns:
            dict with status
        """
        workflow = await self.workflow_repo.get_by_id(workflow_id)
        if not workflow:
            return {"error": "Workflow not found"}

        if step_index >= len(workflow.steps):
            return {"error": "Step not found"}

        step = workflow.steps[step_index]

        if step.status != StepStatus.WAITING_APPROVAL:
            return {"error": "Step is not waiting for approval"}

        # Store feedback
        if feedback:
            step.user_feedback = feedback

        if approved:
            # Mark as approved and completed
            await self._update_step_status(step, StepStatus.APPROVED)
            await self._update_step_status(step, StepStatus.COMPLETED)

            # Advance to next step
            await self.workflow_repo.advance_step(workflow_id)

            # Resume execution
            return await self.execute_workflow(workflow_id)
        else:
            # Rejected - mark step as rejected
            await self._update_step_status(step, StepStatus.REJECTED)

            # Could implement retry logic here
            # For now, just fail the workflow
            await self.workflow_repo.update_status(
                workflow_id,
                WorkflowStatus.FAILED,
                error_message="Step rejected by user",
            )
            return {"status": "rejected", "step_index": step_index}

    async def _execute_step(self, workflow_id: int, step: WorkflowStep) -> dict:
        """
        Execute a single workflow step.

        Args:
            workflow_id: Workflow ID
            step: WorkflowStep to execute

        Returns:
            dict with execution result
        """
        # Mark step as running
        await self._update_step_status(step, StepStatus.RUNNING)
        step.started_at = datetime.now(timezone.utc)

        start_time = datetime.now(timezone.utc)

        try:
            # Build prompt based on step type and previous steps
            prompt = await self._build_step_prompt(workflow_id, step)
            step.input_prompt = prompt

            # Handle external API steps
            if step.step_type == StepType.HUMANIZE:
                # Use Undetectable AI for humanization
                result = await self.external_api_service.undetectable_ai_humanize(
                    text=prompt, api_key=None  # Uses config
                )
                if "error" in result:
                    return {"error": result["error"]}
                output = result.get("humanized_text", "")
                step.output = output

                # Calculate execution time
                end_time = datetime.now(timezone.utc)
                step.execution_time_ms = int(
                    (end_time - start_time).total_seconds() * 1000
                )
                step.completed_at = end_time
                step.token_count = len(output) // 4

                return {"success": True, "output": output}

            elif step.step_type == StepType.AI_DETECTION:
                # Use GPTZero for AI detection
                result = await self.external_api_service.gptzero_detect(
                    text=prompt, api_key=None  # Uses config
                )
                if "error" in result:
                    return {"error": result["error"]}

                # Format detection results
                output = f"""AI Detection Report:
- AI Probability: {result.get('ai_probability', 0):.2%}
- Classification: {result.get('overall_class', 'Unknown')}
- Average Sentence Perplexity: {result.get('average_perplexity', 0):.2f}
- Sentences with AI: {result.get('sentences_ai_count', 0)}/{result.get('total_sentences', 0)}
"""
                step.output = output

                # Calculate execution time
                end_time = datetime.now(timezone.utc)
                step.execution_time_ms = int(
                    (end_time - start_time).total_seconds() * 1000
                )
                step.completed_at = end_time
                step.token_count = len(output) // 4

                return {"success": True, "output": output}

            # Default: Use LLM for other step types
            model = step.model or "gpt-4o"
            techniques = step.techniques or []

            # For non-streaming execution
            output = await self.optillm_service.chat_completion_sync(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                techniques=techniques,
            )

            step.output = output

            # Calculate execution time
            end_time = datetime.now(timezone.utc)
            step.execution_time_ms = int((end_time - start_time).total_seconds() * 1000)
            step.completed_at = end_time

            # Estimate token count (rough approximation)
            step.token_count = len(output) // 4

            return {"success": True, "output": output}

        except Exception as e:
            step.error_message = str(e)
            return {"error": str(e)}

    async def _build_step_prompt(self, workflow_id: int, step: WorkflowStep) -> str:
        """
        Build prompt for a step based on type and context.

        Args:
            workflow_id: Workflow ID
            step: Current step

        Returns:
            Prompt string
        """
        workflow = await self.workflow_repo.get_by_id(workflow_id)

        # Base context from workflow goal
        context = f"Goal: {workflow.goal}\n\n"

        # Add outputs from previous completed steps
        for prev_step in workflow.steps:
            if prev_step.step_index < step.step_index and prev_step.output:
                context += f"{prev_step.name}:\n{prev_step.output}\n\n"

        # Build step-specific prompt based on type
        if step.step_type == StepType.PLAN:
            prompt = f"{context}Create a detailed plan to achieve the goal. Break it down into clear steps."
        elif step.step_type == StepType.DRAFT:
            prompt = f"{context}Based on the plan above, write the complete draft."
        elif step.step_type == StepType.VERIFY:
            prompt = f"{context}Verify that the draft meets all requirements from the goal. Check for accuracy and completeness."
        elif step.step_type == StepType.HUMANIZE:
            prompt = f"{context}Rewrite the text to sound more natural and human-like while preserving all facts."
        elif step.step_type == StepType.INTEGRITY_CHECK:
            prompt = f"{context}Compare the humanized version with the original draft. Ensure all key facts are preserved."
        elif step.step_type == StepType.AI_DETECTION:
            prompt = f"{context}Analyze the text for AI detection risk. Suggest improvements to sound more human."
        else:
            # Custom step - use description as prompt
            prompt = f"{context}{step.description or 'Proceed with the task.'}"

        # Add step-specific parameters
        if step.parameters:
            param_str = "\n".join([f"- {k}: {v}" for k, v in step.parameters.items()])
            prompt += f"\n\nAdditional requirements:\n{param_str}"

        return prompt

    async def _update_step_status(self, step: WorkflowStep, status: StepStatus) -> None:
        """Update step status in database."""
        step.status = status
        # Note: In production, you'd use a StepRepository for this
        # For now, relying on WorkflowRepository to handle cascade updates

    def _compile_results(self, steps: list[WorkflowStep]) -> str:
        """
        Compile final result from all completed steps.

        Args:
            steps: List of workflow steps

        Returns:
            Combined result string
        """
        result = ""
        for step in steps:
            if step.output:
                result += f"## {step.name}\n\n{step.output}\n\n"
        return result
