/**
 * Workflow API client for interacting with workflow endpoints.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface WorkflowStep {
  id: number;
  workflow_id: number;
  step_index: number;
  step_type: string;
  name: string;
  description?: string;
  model?: string;
  techniques: string[];
  parameters: Record<string, any>;
  requires_approval: boolean;
  approval_prompt?: string;
  status: string;
  input_prompt?: string;
  output?: string;
  user_feedback?: string;
  execution_time_ms?: number;
  token_count?: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  goal: string;
  status: string;
  current_step_index: number;
  config: Record<string, any>;
  result?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  steps: WorkflowStep[];
}

export interface CreateWorkflowRequest {
  name: string;
  goal: string;
  description?: string;
  config?: Record<string, any>;
}

export interface CreateStepRequest {
  step_index: number;
  step_type: string;
  name: string;
  description?: string;
  model?: string;
  techniques?: string[];
  parameters?: Record<string, any>;
  requires_approval?: boolean;
  approval_prompt?: string;
}

export interface ApproveStepRequest {
  approved: boolean;
  feedback?: string;
}

export interface UpdateWorkflowStatusRequest {
  status: string;
  error_message?: string;
}

/**
 * Create a new workflow.
 */
export async function createWorkflow(request: CreateWorkflowRequest): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workflow: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a workflow by ID.
 */
export async function getWorkflow(workflowId: number): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/v1/workflows/${workflowId}`);

  if (!response.ok) {
    throw new Error(`Failed to get workflow: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all workflows.
 */
export async function listWorkflows(
  status?: string,
  limit = 50,
  offset = 0
): Promise<{ workflows: Workflow[]; total: number }> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_URL}/api/v1/workflows?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to list workflows: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Add a step to a workflow.
 */
export async function addWorkflowStep(
  workflowId: number,
  step: CreateStepRequest
): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/v1/workflows/${workflowId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step),
  });

  if (!response.ok) {
    throw new Error(`Failed to add step: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Execute a workflow.
 */
export async function executeWorkflow(workflowId: number): Promise<any> {
  const response = await fetch(`${API_URL}/api/v1/workflows/${workflowId}/execute`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to execute workflow: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Approve or reject a step.
 */
export async function approveStep(
  workflowId: number,
  stepIndex: number,
  request: ApproveStepRequest
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/v1/workflows/${workflowId}/steps/${stepIndex}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to approve step: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update workflow status.
 */
export async function updateWorkflowStatus(
  workflowId: number,
  request: UpdateWorkflowStatusRequest
): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/v1/workflows/${workflowId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to update workflow status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a workflow.
 */
export async function deleteWorkflow(workflowId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/workflows/${workflowId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete workflow: ${response.statusText}`);
  }
}
