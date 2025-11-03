'use client';

import { approveStep, executeWorkflow, getWorkflow, Workflow } from '@/lib/workflow-api';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApprovalGate } from './approval-gate';
import { WorkflowStepper } from './workflow-stepper';

interface WorkflowCanvasProps {
  workflowId: number;
  onComplete?: (workflow: Workflow) => void;
}

export function WorkflowCanvas({ workflowId, onComplete }: WorkflowCanvasProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch workflow data
  const fetchWorkflow = async () => {
    try {
      const data = await getWorkflow(workflowId);
      setWorkflow(data);
      setError(null);

      // If workflow is complete, notify parent
      if (data.status === 'COMPLETED' && onComplete) {
        onComplete(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  };

  // Start workflow execution
  const handleExecute = async () => {
    if (!workflow) return;

    setExecuting(true);
    setError(null);

    try {
      await executeWorkflow(workflowId);
      await fetchWorkflow();

      // Start polling for updates
      const interval = setInterval(fetchWorkflow, 2000);
      setPollingInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  // Handle approval gate
  const handleApproval = async (approved: boolean, feedback?: string) => {
    if (!workflow) return;

    const currentStep = workflow.steps[workflow.current_step_index];
    if (!currentStep) return;

    setExecuting(true);
    setError(null);

    try {
      await approveStep(workflowId, currentStep.step_index, { approved, feedback });
      await fetchWorkflow();

      // Continue polling if not complete
      if (workflow.status !== 'COMPLETED' && workflow.status !== 'FAILED') {
        const interval = setInterval(fetchWorkflow, 2000);
        setPollingInterval(interval);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process approval');
    } finally {
      setExecuting(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWorkflow();

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [workflowId]);

  // Stop polling when workflow is complete or paused
  useEffect(() => {
    if (
      workflow &&
      (workflow.status === 'COMPLETED' ||
        workflow.status === 'FAILED' ||
        workflow.status === 'PAUSED') &&
      pollingInterval
    ) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [workflow?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Workflow not found
      </div>
    );
  }

  const currentStep = workflow.steps[workflow.current_step_index];
  const needsApproval =
    workflow.status === 'PAUSED' && currentStep?.status === 'WAITING_APPROVAL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workflow.name}
            </h2>
            {workflow.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">{workflow.description}</p>
            )}
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Goal: <span className="text-blue-600 dark:text-blue-400">{workflow.goal}</span>
            </p>
          </div>

          {/* Execute/Refresh Button */}
          {workflow.status === 'PENDING' && (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {executing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Workflow'
              )}
            </button>
          )}

          {workflow.status === 'RUNNING' && (
            <button
              onClick={fetchWorkflow}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {workflow.error_message && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Workflow Error
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {workflow.error_message}
            </p>
          </div>
        </div>
      )}

      {/* Workflow Stepper */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <WorkflowStepper
          steps={workflow.steps}
          currentStepIndex={workflow.current_step_index}
          workflowStatus={workflow.status}
        />
      </div>

      {/* Current Step Details */}
      {currentStep && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Step: {currentStep.name}
          </h3>

          {currentStep.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{currentStep.description}</p>
          )}

          {/* Step Configuration */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {currentStep.model && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Model:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{currentStep.model}</span>
              </div>
            )}
            {currentStep.techniques.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Techniques:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {currentStep.techniques.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Approval Gate */}
          {needsApproval && currentStep.output && (
            <ApprovalGate
              step={currentStep}
              onApprove={handleApproval}
              isProcessing={executing}
            />
          )}

          {/* Step Output (if not in approval) */}
          {!needsApproval && currentStep.output && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output:
              </h4>
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {currentStep.output}
              </div>
            </div>
          )}

          {/* Step Error */}
          {currentStep.error_message && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-600">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Error:</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                {currentStep.error_message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Final Result */}
      {workflow.status === 'COMPLETED' && workflow.result && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Workflow Complete!
          </h3>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Final Result:
            </h4>
            <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {workflow.result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
