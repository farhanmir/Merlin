'use client';

import { useChatStore } from '@/lib/store';
import { Clock, Zap, DollarSign, TrendingUp } from 'lucide-react';

// Model pricing per 1M tokens (input/output) as of Nov 2024
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'o1': { input: 15.0, output: 60.0 },
  'o1-mini': { input: 3.0, output: 12.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'gemini-2.5-pro-latest': { input: 1.25, output: 5.0 },
  'gemini-2.5-flash-latest': { input: 0.075, output: 0.3 },
  'gemini-2.5-flash-lite-latest': { input: 0.0375, output: 0.15 },
  'gemini-2.0-flash-exp': { input: 0.0, output: 0.0 }, // Free
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
};

export function PerformanceMetrics() {
  const messages = useChatStore((state) => state.messages);

  // Filter assistant messages with metrics
  const metricsMessages = messages.filter(
    (msg) => msg.role === 'assistant' && msg.latencyMs && msg.tokenCount
  );

  if (metricsMessages.length === 0) {
    return null;
  }

  // Calculate overall stats
  const totalMessages = metricsMessages.length;
  const avgLatency =
    metricsMessages.reduce((sum, msg) => sum + (msg.latencyMs || 0), 0) / totalMessages;
  const totalTokens = metricsMessages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0);

  // Calculate total cost (rough estimate assuming equal input/output)
  const totalCost = metricsMessages.reduce((sum, msg) => {
    const model = msg.model || 'gpt-4o';
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'];
    const tokens = msg.tokenCount || 0;
    // Rough: assume 50% input, 50% output
    const cost = (tokens / 1_000_000) * ((pricing.input + pricing.output) / 2);
    return sum + cost;
  }, 0);

  // Technique performance
  const techniqueStats = metricsMessages.reduce(
    (acc, msg) => {
      const techniques = msg.techniques || [];
      const latency = msg.latencyMs || 0;

      for (const tech of techniques) {
        if (!acc[tech]) {
          acc[tech] = { count: 0, totalLatency: 0 };
        }
        acc[tech].count++;
        acc[tech].totalLatency += latency;
      }

      return acc;
    },
    {} as Record<string, { count: number; totalLatency: number }>
  );

  const topTechniques = Object.entries(techniqueStats)
    .map(([name, stats]) => ({
      name,
      avgLatency: stats.totalLatency / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Performance Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Average Latency */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-3 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Avg Response
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {(avgLatency / 1000).toFixed(2)}s
          </div>
        </div>

        {/* Total Tokens */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-3 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Total Tokens
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {totalTokens.toLocaleString()}
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 p-3 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Est. Cost
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            ${totalCost.toFixed(4)}
          </div>
        </div>

        {/* Total Responses */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-3 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Responses
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {totalMessages}
          </div>
        </div>
      </div>

      {/* Top Techniques */}
      {topTechniques.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Top Techniques
          </h4>
          {topTechniques.map((tech) => (
            <div
              key={tech.name}
              className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {tech.name.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {tech.count} uses
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {(tech.avgLatency / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
