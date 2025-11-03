'use client';

import { WorkflowCanvas } from '@/components/workflows/workflow-canvas';
import { WorkflowWizard } from '@/components/workflows/workflow-wizard';
import { listWorkflows, Workflow } from '@/lib/workflow-api';
import { ArrowLeft, Clock, FileText, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      const data = await listWorkflows();
      setWorkflows(data.workflows);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Handle wizard complete
  const handleWizardComplete = (workflowId: number) => {
    setShowWizard(false);
    setSelectedWorkflowId(workflowId);
    fetchWorkflows();
  };

  // Handle workflow complete
  const handleWorkflowComplete = () => {
    fetchWorkflows();
  };

  // Show workflow canvas
  if (selectedWorkflowId !== null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <button
            onClick={() => setSelectedWorkflowId(null)}
            className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Workflows
          </button>

          <WorkflowCanvas workflowId={selectedWorkflowId} onComplete={handleWorkflowComplete} />
        </div>
      </div>
    );
  }

  // Show workflows list
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflows</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Agentic multi-step tasks with approval gates
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
            >
              Chat
            </Link>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Workflow
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Empty State */}
        {!loading && workflows.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first workflow to get started
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Workflow
            </button>
          </div>
        )}

        {/* Workflows Grid */}
        {!loading && workflows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => setSelectedWorkflowId(workflow.id)}
                className="text-left p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : workflow.status === 'RUNNING'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : workflow.status === 'PAUSED'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : workflow.status === 'FAILED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {workflow.status}
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {workflow.steps.length} steps
                  </span>
                </div>

                {/* Workflow Info */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {workflow.name}
                </h3>

                {workflow.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {workflow.description}
                  </p>
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                  <span className="font-medium">Goal:</span> {workflow.goal}
                </p>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>
                      {workflow.current_step_index}/{workflow.steps.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          workflow.steps.length > 0
                            ? (workflow.current_step_index / workflow.steps.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(workflow.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Wizard Modal */}
        {showWizard && (
          <WorkflowWizard
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </div>
    </div>
  );
}
