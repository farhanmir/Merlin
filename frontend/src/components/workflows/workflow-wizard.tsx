'use client';

import { createWorkflow, addWorkflowStep, CreateStepRequest } from '@/lib/workflow-api';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/lib/workflow-templates';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface WorkflowWizardProps {
  onComplete: (workflowId: number) => void;
  onCancel: () => void;
}

const STEP_TYPES = [
  { value: 'PLAN', label: 'Plan', icon: '📋', description: 'Create a structured plan' },
  { value: 'DRAFT', label: 'Draft', icon: '✍️', description: 'Generate initial content' },
  { value: 'VERIFY', label: 'Verify', icon: '✓', description: 'Check requirements' },
  { value: 'HUMANIZE', label: 'Humanize', icon: '🤖→👤', description: 'Make text natural' },
  { value: 'INTEGRITY_CHECK', label: 'Integrity Check', icon: '🔍', description: 'Verify accuracy' },
  { value: 'AI_DETECTION', label: 'AI Detection', icon: '🎯', description: 'Check AI signatures' },
  { value: 'CUSTOM', label: 'Custom', icon: '⚙️', description: 'Custom step' },
];

interface StepConfig extends CreateStepRequest {
  id: string; // Temporary ID for UI
}

export function WorkflowWizard({ onComplete, onCancel }: WorkflowWizardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowGoal, setWorkflowGoal] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new step
  const handleAddStep = () => {
    const newStep: StepConfig = {
      id: `step-${Date.now()}`,
      step_index: steps.length,
      step_type: 'PLAN',
      name: `Step ${steps.length + 1}`,
      description: '',
      model: 'gpt-4o',
      techniques: [],
      parameters: {},
      requires_approval: false,
      approval_prompt: '',
    };
    setSteps([...steps, newStep]);
  };

  // Remove step
  const handleRemoveStep = (id: string) => {
    const updatedSteps = steps
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, step_index: idx }));
    setSteps(updatedSteps);
  };

  // Update step
  const handleUpdateStep = (id: string, updates: Partial<StepConfig>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Create workflow
  const handleCreate = async () => {
    if (!workflowName.trim() || !workflowGoal.trim() || steps.length === 0) {
      setError('Please fill in all required fields and add at least one step');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create workflow
      const workflow = await createWorkflow({
        name: workflowName,
        goal: workflowGoal,
        description: workflowDescription || undefined,
      });

      // Add steps
      for (const step of steps) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...stepData } = step;
        await addWorkflowStep(workflow.id, stepData);
      }

      onComplete(workflow.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setIsCreating(false);
    }
  };

  // Load template
  const handleLoadTemplate = (template: WorkflowTemplate) => {
    setWorkflowName(template.name);
    setWorkflowGoal(template.goal);
    setWorkflowDescription(template.description);
    setSteps(
      template.steps.map((step, idx) => ({
        ...step,
        id: `step-${idx}`,
        step_index: idx,
      }))
    );
    setCurrentPage(1);
  };

  // Page 0: Template Selection
  const renderPage0 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose a Template
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Start with a pre-built workflow or create from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {WORKFLOW_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleLoadTemplate(template)}
            className="text-left p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{template.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {template.steps.length} steps
                </p>
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(1)}
          className="text-left p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">✨</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Start from Scratch
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Create a custom workflow tailored to your needs
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Page 1: Workflow Details
  const renderPage1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Workflow Name *
        </label>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="e.g., Essay Writer Pro"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Goal *
        </label>
        <textarea
          value={workflowGoal}
          onChange={(e) => setWorkflowGoal(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
          placeholder="What should this workflow accomplish?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={2}
          placeholder="Optional description"
        />
      </div>
    </div>
  );

  // Page 2: Configure Steps
  const renderPage2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workflow Steps</h3>
        <button
          onClick={handleAddStep}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No steps added yet. Click "Add Step" to begin.
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {STEP_TYPES.find((t) => t.value === step.step_type)?.icon || '⚙️'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Step {idx + 1}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStep(step.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Step Type
                  </label>
                  <select
                    value={step.step_type}
                    onChange={(e) => handleUpdateStep(step.id, { step_type: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {STEP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={step.model || ''}
                    onChange={(e) => handleUpdateStep(step.id, { model: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., gpt-4o"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={step.requires_approval}
                      onChange={(e) =>
                        handleUpdateStep(step.id, { requires_approval: e.target.checked })
                      }
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    Requires Approval
                  </label>
                </div>

                {step.requires_approval && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Approval Prompt
                    </label>
                    <input
                      type="text"
                      value={step.approval_prompt || ''}
                      onChange={(e) =>
                        handleUpdateStep(step.id, { approval_prompt: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="What should the user review?"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Workflow
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {currentPage === 0 ? renderPage0() : currentPage === 1 ? renderPage1() : renderPage2()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                currentPage === 0 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                currentPage === 1 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                currentPage === 2 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                currentPage === 1 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          </div>

          <div className="flex gap-3">
            {currentPage > 0 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                Previous
              </button>
            )}

            {currentPage < 2 ? (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === 1 && (!workflowName.trim() || !workflowGoal.trim())}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating || steps.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Workflow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
