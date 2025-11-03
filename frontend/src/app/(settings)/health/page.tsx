'use client';

import { useEffect, useState } from 'react';
import { fetchHealthStatus, type HealthStatus } from '@/lib/api';
import { 
  Activity, 
  Database, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await fetchHealthStatus();
      setHealth(data);
      setLastCheck(new Date());
      toast.success('Health status updated');
    } catch (error) {
      toast.error('Failed to fetch health status', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'degraded':
        return <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case 'unhealthy':
        return <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      default:
        return <Activity className="h-6 w-6 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'from-green-500/10 to-green-600/10 border-green-500/20';
      case 'degraded':
        return 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20';
      case 'unhealthy':
        return 'from-red-500/10 to-red-600/10 border-red-500/20';
      default:
        return 'from-gray-500/10 to-gray-600/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-600" />
              System Health
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor service status and API key configuration
            </p>
          </div>

          <button
            onClick={loadHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && !health ? (
          <div className="text-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Checking system health...</p>
          </div>
        ) : health ? (
          <>
            {/* Overall Status */}
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getStatusBgColor(health.overall_status)} p-8 border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(health.overall_status)}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      System {health.overall_status}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Last checked: {lastCheck.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Services</h2>

              {/* Database */}
              {health.services.database && (
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getStatusBgColor(health.services.database.status)} p-6 border`}>
                  <div className="flex items-start gap-4">
                    <Database className={`h-6 w-6 ${getStatusColor(health.services.database.status)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Database
                        </h3>
                        <span className={`text-sm font-medium capitalize ${getStatusColor(health.services.database.status)}`}>
                          {health.services.database.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {health.services.database.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* OptiLLM */}
              {health.services.optillm && (
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getStatusBgColor(health.services.optillm.status)} p-6 border`}>
                  <div className="flex items-start gap-4">
                    <Zap className={`h-6 w-6 ${getStatusColor(health.services.optillm.status)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          OptiLLM Proxy
                        </h3>
                        <span className={`text-sm font-medium capitalize ${getStatusColor(health.services.optillm.status)}`}>
                          {health.services.optillm.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {health.services.optillm.message}
                      </p>
                      <code className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                        {health.services.optillm.url}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* API Keys */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Key Status</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(health.api_keys).map(([provider, status]) => {
                  if (provider === 'error') return null;
                  
                  const isConfigured = status.configured && status.valid;
                  const statusColor = isConfigured ? 'green' : 'red';
                  const bgColor = isConfigured 
                    ? 'from-green-500/10 to-green-600/10 border-green-500/20'
                    : 'from-red-500/10 to-red-600/10 border-red-500/20';

                  return (
                    <div
                      key={provider}
                      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${bgColor} p-6 border`}
                    >
                      <div className="flex items-start gap-3">
                        <Key className={`h-5 w-5 text-${statusColor}-600 dark:text-${statusColor}-400`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize mb-1">
                            {provider}
                          </h3>
                          {isConfigured ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className={`h-4 w-4 text-${statusColor}-600 dark:text-${statusColor}-400`} />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Configured & Valid
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className={`h-4 w-4 text-${statusColor}-600 dark:text-${statusColor}-400`} />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {status.configured ? 'Invalid' : 'Not Configured'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(health.api_keys).filter(k => k !== 'error').every(provider => !health.api_keys[provider].configured) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                        No API Keys Configured
                      </h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        You need to add at least one API key to use Merlin AI. Visit the{' '}
                        <Link href="/settings" className="underline hover:text-yellow-600">
                          Settings page
                        </Link>{' '}
                        to configure your keys.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to Load Health Status
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to connect to the backend service
            </p>
            <button
              onClick={loadHealth}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
