"""Essay Writer workflow template - demonstrates full agentic workflow."""

from merlin.db.workflow_models import StepType

ESSAY_WRITER_TEMPLATE = {
    "name": "Essay Writer",
    "description": "Multi-step workflow for writing essays with AI detection avoidance",
    "steps": [
        {
            "name": "Planning Phase",
            "step_type": StepType.PLAN,
            "description": "Analyze requirements and create essay outline",
            "model": "gpt-4o",
            "techniques": ["plansearch"],  # OptiLLM plansearch for better planning
            "requires_approval": True,
            "system_prompt": """You are an expert essay planner. Analyze the user's requirements and create a detailed outline.

Your outline should include:
1. Thesis statement
2. Main points (3-5 arguments)
3. Supporting evidence for each point
4. Introduction and conclusion hooks
5. Estimated word count per section

Format your response as a structured outline.""",
        },
        {
            "name": "Draft Writing",
            "step_type": StepType.DRAFT,
            "description": "Write the full essay based on approved plan",
            "model": "claude-3-5-sonnet-latest",  # Claude for creative writing
            "techniques": ["cot_reflection"],  # Chain of thought + reflection
            "requires_approval": True,
            "system_prompt": """You are an expert academic writer. Using the approved outline, write a complete essay.

Requirements:
- Follow the outline structure exactly
- Use formal academic tone
- Include proper transitions between paragraphs
- Cite sources where appropriate (use placeholders like [Source 1])
- Meet the specified word count

Write the full essay now.""",
        },
        {
            "name": "Requirement Verification",
            "step_type": StepType.VERIFY,
            "description": "Check if essay meets all requirements",
            "model": "gpt-4o",
            "techniques": [],
            "requires_approval": True,
            "system_prompt": """You are an essay reviewer. Verify the draft meets all requirements.

Check:
1. Word count matches requirement
2. All outline points covered
3. Proper structure (intro, body, conclusion)
4. Academic tone maintained
5. No grammatical errors

Provide a detailed verification report with:
- ✓ Requirements met
- ✗ Requirements not met (with specific issues)
- Suggested improvements

Format as a checklist report.""",
        },
        {
            "name": "Humanization",
            "step_type": StepType.HUMANIZE,
            "description": "Humanize essay to avoid AI detection",
            "model": None,  # Uses Undetectable AI API
            "techniques": [],
            "requires_approval": True,
            "system_prompt": None,  # External API, no LLM needed
            "config": {
                "readability": "high_school",  # Undetectable AI parameter
                "purpose": "essay",
            },
        },
        {
            "name": "Final Integrity Check",
            "step_type": StepType.INTEGRITY_CHECK,
            "description": "Ensure humanization preserved content accuracy",
            "model": "gpt-4o-mini",  # Fast model for comparison
            "techniques": [],
            "requires_approval": True,
            "system_prompt": """You are a content integrity checker. Compare the original draft with the humanized version.

Verify:
1. All main points from original are preserved
2. Facts and arguments unchanged
3. Thesis statement maintained
4. No meaning distorted by humanization
5. Word count within ±50 words of original

Provide a detailed comparison report with:
- Content Preserved: [Yes/No]
- Issues Found: [List any problems]
- Recommendation: [Approve/Request Revision]

If any critical content is lost or distorted, flag for revision.""",
        },
        {
            "name": "AI Detection Check",
            "step_type": StepType.AI_DETECTION,
            "description": "Run AI detection on final essay",
            "model": None,  # Uses GPTZero API
            "techniques": [],
            "requires_approval": False,  # Auto-completes, user sees report
            "system_prompt": None,  # External API, no LLM needed
            "config": {
                "multilingual": False,
                "version": "2024-01-09",
            },
        },
    ],
}


async def create_essay_workflow(
    workflow_repo, goal: str, requirements: dict | None = None
):
    """
    Create an Essay Writer workflow instance.

    Args:
        workflow_repo: WorkflowRepository instance
        goal: User's essay goal/topic
        requirements: Optional dict with word_count, style, sources, etc.

    Returns:
        Created workflow instance
    """
    workflow = await workflow_repo.create(
        name=ESSAY_WRITER_TEMPLATE["name"],
        goal=goal,
        description=ESSAY_WRITER_TEMPLATE["description"],
        config={"requirements": requirements or {}, "template": "essay_writer"},
    )

    # Add all steps from template
    for step_config in ESSAY_WRITER_TEMPLATE["steps"]:
        await workflow_repo.add_step(
            workflow_id=workflow.id,
            name=step_config["name"],
            step_type=step_config["step_type"],
            description=step_config["description"],
            model=step_config.get("model"),
            techniques=step_config.get("techniques", []),
            requires_approval=step_config.get("requires_approval", False),
            system_prompt=step_config.get("system_prompt"),
            config=step_config.get("config", {}),
        )

    return await workflow_repo.get_by_id(workflow.id)
