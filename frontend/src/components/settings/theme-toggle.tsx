'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Theme
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose your preferred color scheme
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {themes.map(({ value, icon: Icon, label }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                isActive
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500"></div>
              )}
              <Icon
                className={`w-6 h-6 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
