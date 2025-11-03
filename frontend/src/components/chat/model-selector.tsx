'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { Cpu, AlertCircle } from 'lucide-react';

export function ModelSelector() {
  const { availableModels, selectedModel, setSelectedModel, fetchModels } = useChatStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  if (availableModels.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/50 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              No API Keys Configured
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Add your API keys in Settings to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="model-select"
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        <Cpu className="w-4 h-4 text-primary-500" />
        Model Selection
      </label>
      <div className="relative">
        <select
          id="model-select"
          value={selectedModel || ''}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          <option value="" className="text-gray-500">Select a model...</option>
          {availableModels.map((model) => (
            <option key={model.id} value={model.id} className="py-2">
              {model.provider}: {model.name}
            </option>
          ))}
        </select>
      </div>
      {selectedModel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Model ready
        </p>
      )}
    </div>
  );
}
