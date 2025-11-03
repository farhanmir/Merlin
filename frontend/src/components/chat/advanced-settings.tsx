'use client';

import { ChevronDown, ChevronUp, Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModelSelector } from './model-selector';
import { TechniquePanel } from './technique-panel';

export function AdvancedSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          <span>Advanced Settings</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="px-3 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-900">
          <ModelSelector />
          <TechniquePanel />
        </div>
      )}
    </div>
  );
}
