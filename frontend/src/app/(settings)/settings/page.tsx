import { ApiKeyManager } from '@/components/settings/api-key-manager';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { HelpSection } from '@/components/settings/help-section';
import { Activity } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - Merlin',
  description: 'Manage your API keys and preferences',
};

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      {/* Theme Settings */}
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Appearance
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Customize how Merlin looks on your device
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <ThemeToggle />
        </div>
      </section>

      {/* API Key Management */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            API Key Management
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Add your API keys to enable AI providers. Keys are encrypted and stored securely.
          </p>
        </div>
        <ApiKeyManager />
      </section>

      {/* Help & Support */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Help & Support
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get assistance or manage your data
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <HelpSection />
        </div>
      </section>

      {/* System Health */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            System Health
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor service status and connectivity
          </p>
        </div>
        <Link href="/health">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 rounded-xl p-6 shadow-sm transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600/10 rounded-lg group-hover:bg-purple-600/20 transition-colors">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  View Health Dashboard
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check backend services, OptiLLM proxy, and API key status
                </p>
              </div>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
