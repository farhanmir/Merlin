'use client';

import { useEffect, useState } from 'react';
import { ApiKeyForm } from './api-key-form';
import { fetchApiKeys, deleteApiKey } from '@/lib/api';
import type { ApiKey } from '@/lib/types';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const providers = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google' },
] as const;

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const data = await fetchApiKeys();
      setKeys(data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys', {
        description: 'Please check your connection and try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleDelete = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete the ${provider} API key?`)) {
      return;
    }

    try {
      await deleteApiKey(provider);
      await loadKeys();
      toast.success(`${provider} API key deleted successfully`);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key', {
        description: 'Please try again later',
      });
    }
  };

  const handleSuccess = () => {
    setEditingProvider(null);
    loadKeys();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {providers.map((provider) => {
        const existingKey = keys.find((k) => k.provider === provider.id);
        const isEditing = editingProvider === provider.id;

        return (
          <div
            key={provider.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {provider.name}
                </h3>
                {existingKey && (
                  existingKey.isValid ? (
                    <CheckCircle className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )
                )}
              </div>
              {existingKey && !isEditing && (
                <button
                  onClick={() => handleDelete(provider.id)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-smooth"
                  aria-label="Delete API key"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {existingKey && !isEditing ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  API Key: <code className="font-mono">{existingKey.maskedKey}</code>
                </p>
                <button
                  onClick={() => setEditingProvider(provider.id)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Update key
                </button>
              </div>
            ) : (
              <ApiKeyForm
                provider={provider.id}
                onSuccess={handleSuccess}
                onCancel={existingKey ? () => setEditingProvider(null) : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
