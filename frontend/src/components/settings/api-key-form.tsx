'use client';

import { useState, FormEvent } from 'react';
import { addApiKey } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyFormProps {
  provider: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ApiKeyForm({ provider, onSuccess, onCancel }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await addApiKey(provider, apiKey);
      setApiKey('');
      toast.success(`${provider} API key validated and saved successfully`);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate API key';
      setError(errorMessage);
      toast.error('API key validation failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor={`api-key-${provider}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          API Key for {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </label>
        <input
          type="password"
          id={`api-key-${provider}`}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!apiKey.trim() || loading}
          className="flex-1 bg-primary-600 dark:bg-primary-500 text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Validating...' : 'Validate & Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-smooth"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
