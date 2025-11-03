'use client';

import { HelpCircle, RotateCcw } from 'lucide-react';

export function HelpSection() {
  const resetOnboarding = () => {
    localStorage.removeItem('merlin-has-seen-guide');
    window.location.href = '/';
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure? This will clear all messages, settings, and API keys.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Help & Support
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Get help or reset your settings
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={resetOnboarding}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-gray-800/50 hover:bg-gradient-to-br hover:from-primary-50 hover:to-purple-50 dark:hover:from-primary-900/20 dark:hover:to-purple-900/20 transition-all duration-200 group"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Restart Tutorial
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Show the welcome guide again
            </div>
          </div>
        </button>

        <button
          onClick={clearAllData}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-400 bg-white dark:bg-gray-800/50 hover:bg-gradient-to-br hover:from-red-50 hover:to-orange-50 dark:hover:from-red-900/20 dark:hover:to-orange-900/20 transition-all duration-200 group"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-sm">
            <RotateCcw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Reset All Data
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Clear messages, settings, and API keys
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
