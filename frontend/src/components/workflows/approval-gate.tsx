'use client';

import { WorkflowStep } from '@/lib/workflow-api';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface ApprovalGateProps {
  step: WorkflowStep;
  onApprove: (approved: boolean, feedback?: string) => Promise<void>;
  isProcessing: boolean;
}

export function ApprovalGate({ step, onApprove, isProcessing }: ApprovalGateProps) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleApprove = async () => {
    await onApprove(true, feedback || undefined);
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      setShowFeedback(true);
      return;
    }
    await onApprove(false, feedback);
  };

  return (
    <div className="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">⏸️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Approval Required
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {step.approval_prompt || 'Please review the output before continuing'}
          </p>
        </div>
      </div>

      {/* Step Output */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Step Output:
        </h4>
        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
          {step.output || 'No output yet'}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400">
        {step.execution_time_ms && (
          <div>
            <span className="font-medium">Execution Time:</span>{' '}
            {(step.execution_time_ms / 1000).toFixed(2)}s
          </div>
        )}
        {step.token_count && (
          <div>
            <span className="font-medium">Tokens:</span> {step.token_count.toLocaleString()}
          </div>
        )}
      </div>

      {/* Feedback Input */}
      {(showFeedback || feedback) && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Feedback (required for rejection):
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={3}
            placeholder="Enter your feedback or requested changes..."
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          <Check className="w-5 h-5" />
          {isProcessing ? 'Processing...' : 'Approve & Continue'}
        </button>

        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
          {isProcessing ? 'Processing...' : 'Reject & Stop'}
        </button>

        {!showFeedback && (
          <button
            onClick={() => setShowFeedback(true)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
          >
            Add Feedback
          </button>
        )}
      </div>
    </div>
  );
}
