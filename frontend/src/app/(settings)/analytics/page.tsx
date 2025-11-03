'use client';

import { useChatStore } from '@/lib/store';
import { BarChart3, Clock, Zap, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Model pricing per 1M tokens (input/output) as of Nov 2024
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 1, output: 5 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'gemini-2.5-pro-latest': { input: 1.25, output: 5 },
  'gemini-2.5-flash-latest': { input: 0.075, output: 0.3 },
  'gemini-2.5-flash-lite-latest': { input: 0.0375, output: 0.15 },
  'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free
  'gemini-1.5-pro': { input: 1.25, output: 5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
};

export default function AnalyticsPage() {
  const messages = useChatStore((state) => state.messages);

  // Filter assistant messages with metrics
  const metricsMessages = messages.filter(
    (msg) => msg.role === 'assistant' && msg.latencyMs && msg.tokenCount
  );

  if (metricsMessages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>

          <div className="text-center py-20">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Analytics Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start chatting to see performance metrics and analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalMessages = metricsMessages.length;
  const avgLatency =
    metricsMessages.reduce((sum, msg) => sum + (msg.latencyMs || 0), 0) / totalMessages;
  const totalTokens = metricsMessages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0);

  const totalCost = metricsMessages.reduce((sum, msg) => {
    const model = msg.model || 'gpt-4o';
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'];
    const tokens = msg.tokenCount || 0;
    const cost = (tokens / 1_000_000) * ((pricing.input + pricing.output) / 2);
    return sum + cost;
  }, 0);

  // Model performance
  const modelStats = metricsMessages.reduce(
    (acc, msg) => {
      const model = msg.model || 'unknown';
      if (!acc[model]) {
        acc[model] = { count: 0, totalLatency: 0, totalTokens: 0, totalCost: 0 };
      }
      acc[model].count++;
      acc[model].totalLatency += msg.latencyMs || 0;
      acc[model].totalTokens += msg.tokenCount || 0;

      const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'];
      const tokens = msg.tokenCount || 0;
      acc[model].totalCost += (tokens / 1_000_000) * ((pricing.input + pricing.output) / 2);

      return acc;
    },
    {} as Record<string, { count: number; totalLatency: number; totalTokens: number; totalCost: number }>
  );

  const modelPerformance = Object.entries(modelStats)
    .map(([name, stats]) => ({
      name,
      avgLatency: stats.totalLatency / stats.count,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count);

  // Technique performance
  const techniqueStats = metricsMessages.reduce(
    (acc, msg) => {
      const techniques = msg.techniques || [];
      const latency = msg.latencyMs || 0;
      const tokens = msg.tokenCount || 0;

      for (const tech of techniques) {
        if (!acc[tech]) {
          acc[tech] = { count: 0, totalLatency: 0, totalTokens: 0 };
        }
        acc[tech].count++;
        acc[tech].totalLatency += latency;
        acc[tech].totalTokens += tokens;
      }

      return acc;
    },
    {} as Record<string, { count: number; totalLatency: number; totalTokens: number }>
  );

  const techniquePerformance = Object.entries(techniqueStats)
    .map(([name, stats]) => ({
      name,
      avgLatency: stats.totalLatency / stats.count,
      avgTokens: stats.totalTokens / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              Performance Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Insights from {totalMessages} AI responses
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response Time
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {(avgLatency / 1000).toFixed(2)}s
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across all models
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tokens
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ~{(totalTokens / 1000).toFixed(1)}K tokens
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Estimated Cost
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalCost.toFixed(4)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This session
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-6 border border-orange-500/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Responses
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalMessages}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              AI completions
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Model Performance
          </h2>
          <div className="space-y-3">
            {modelPerformance.map((model) => (
              <div
                key={model.name}
                className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {model.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {model.count} uses
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Avg Response
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {(model.avgLatency / 1000).toFixed(2)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Total Tokens
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {model.totalTokens.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Total Cost
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${model.totalCost.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technique Performance */}
        {techniquePerformance.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Technique Performance
            </h2>
            <div className="space-y-3">
              {techniquePerformance.map((tech) => (
                <div
                  key={tech.name}
                  className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                      {tech.name.replace('_', ' ')}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tech.count} uses
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Avg Response Time
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(tech.avgLatency / 1000).toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Avg Tokens
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {Math.round(tech.avgTokens).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
