'use client';

import { WorkflowStep } from '@/lib/workflow-api';
import { Check, Clock, Pause, X } from 'lucide-react';

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
  workflowStatus: string;
}

const stepTypeColors: Record<string, string> = {
  PLAN: 'bg-blue-500',
  DRAFT: 'bg-purple-500',
  VERIFY: 'bg-green-500',
  HUMANIZE: 'bg-yellow-500',
  INTEGRITY_CHECK: 'bg-orange-500',
  AI_DETECTION: 'bg-red-500',
  CUSTOM: 'bg-gray-500',
};

const stepTypeIcons: Record<string, string> = {
  PLAN: '📋',
  DRAFT: '✍️',
  VERIFY: '✓',
  HUMANIZE: '🤖→👤',
  INTEGRITY_CHECK: '🔍',
  AI_DETECTION: '🎯',
  CUSTOM: '⚙️',
};

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Check className="w-5 h-5 text-green-500" />;
    case 'RUNNING':
      return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    case 'WAITING_APPROVAL':
      return <Pause className="w-5 h-5 text-yellow-500" />;
    case 'REJECTED':
    case 'FAILED':
      return <X className="w-5 h-5 text-red-500" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  }
}

export function WorkflowStepper({ steps, currentStepIndex, workflowStatus }: WorkflowStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = step.status === 'COMPLETED' || step.status === 'APPROVED';
          const isPending = index > currentStepIndex;
          const stepColor = stepTypeColors[step.step_type] || 'bg-gray-500';

          return (
            <div key={step.id} className="flex-1 relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-0.5 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}

              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    isActive
                      ? stepColor
                      : isCompleted
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  } ${isActive ? 'ring-4 ring-blue-300 dark:ring-blue-800' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-xl">{stepTypeIcons[step.step_type] || '⚙️'}</span>
                  )}
                </div>

                {/* Step Name */}
                <div className="mt-2 text-sm font-medium text-center text-gray-700 dark:text-gray-300">
                  {step.name}
                </div>

                {/* Step Status */}
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {getStatusIcon(step.status)}
                  <span>{step.status.replace('_', ' ')}</span>
                </div>

                {/* Execution Time */}
                {step.execution_time_ms && (
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {(step.execution_time_ms / 1000).toFixed(2)}s
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Status Banner */}
      <div
        className={`mt-4 p-3 rounded-lg text-sm font-medium ${
          workflowStatus === 'COMPLETED'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : workflowStatus === 'PAUSED'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : workflowStatus === 'FAILED'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : workflowStatus === 'RUNNING'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}
      >
        Workflow Status: <span className="font-bold">{workflowStatus}</span>
      </div>
    </div>
  );
}
