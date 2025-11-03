'use client';

import { useState } from 'react';
import { useChatStore } from '@/lib/store';
import { Technique } from '@/lib/types';
import { ChevronDown, Sparkles, Zap, Clock, AlertTriangle, Info } from 'lucide-react';
import {
  estimateResponseTime,
  formatEstimatedTime,
  calculateTotalApiCalls,
  validateTechniqueCombination,
  TECHNIQUE_OVERHEAD,
} from '@/lib/estimation';

const TECHNIQUES: Array<{
  id: Technique;
  name: string;
  description: string;
  icon: string;
  category: string;
}> = [
  // Core Reasoning Techniques
  // NOTE: MARS and CePO disabled - missing dependencies in backend
  // {
  //   id: 'mars',
  //   name: 'MARS',
  //   description: 'Multi-Agent Reasoning System with diverse temperature exploration',
  //   icon: '🪐',
  //   category: 'Advanced',
  // },
  // {
  //   id: 'cepo',
  //   name: 'CePO',
  //   description: 'Cerebras Planning and Optimization (Best of N + CoT + Self-Reflection)',
  //   icon: '🧠',
  //   category: 'Advanced',
  // },
  {
    id: 'plansearch',
    name: 'PlanSearch',
    description: 'Search algorithm over candidate plans',
    icon: '🎯',
    category: 'Planning',
  },
  {
    id: 'cot_reflection',
    name: 'CoT + Reflection',
    description: 'Chain-of-thought with thinking, reflection, and output sections',
    icon: '🤔',
    category: 'Reasoning',
  },
  {
    id: 'moa',
    name: 'Mixture of Agents',
    description: 'Multiple AI agents collaborate and critique',
    icon: '👥',
    category: 'Multi-Agent',
  },
  
  // Sampling & Verification
  {
    id: 'bon',
    name: 'Best of N',
    description: 'Generate multiple responses and select the best',
    icon: '🏆',
    category: 'Sampling',
  },
  {
    id: 'self_consistency',
    name: 'Self-Consistency',
    description: 'Sample multiple reasoning paths and select most consistent',
    icon: '🎲',
    category: 'Sampling',
  },
  // NOTE: PVG disabled - exceeds free tier rate limits (20+ API calls)
  // {
  //   id: 'pvg',
  //   name: 'Prover-Verifier Game',
  //   description: 'Adversarial prover-verifier approach',
  //   icon: '⚔️',
  //   category: 'Verification',
  // },
  
  // Advanced Search & Optimization
  {
    id: 'mcts',
    name: 'Monte Carlo Tree Search',
    description: 'MCTS for iterative decision-making',
    icon: '🌳',
    category: 'Search',
  },
  {
    id: 'rstar',
    name: 'R* Algorithm',
    description: 'Advanced self-taught reasoning',
    icon: '⭐',
    category: 'Search',
  },
  {
    id: 'rto',
    name: 'Round Trip Optimization',
    description: 'Optimize through round-trip process',
    icon: '🔄',
    category: 'Optimization',
  },
  
  // Specialized Techniques
  {
    id: 'leap',
    name: 'LEAP',
    description: 'Learn task-specific principles from examples',
    icon: '🦘',
    category: 'Learning',
  },
  // NOTE: RE2 disabled - exceeds free tier rate limits (15+ API calls)
  // {
  //   id: 're2',
  //   name: 'ReRead',
  //   description: 'Process queries twice to improve reasoning',
  //   icon: '📖',
  //   category: 'Processing',
  // },
  // NOTE: Z3 disabled - not integrated in OptiLLMService
  // {
  //   id: 'z3',
  //   name: 'Z3 Solver',
  //   description: 'Formal logic using Z3 theorem prover',
  //   icon: '🔬',
  //   category: 'Logic',
  // },
];

export function TechniquePanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedTechniques, toggleTechnique, selectedModel } = useChatStore();

  // Group techniques by category
  const categories = Array.from(new Set(TECHNIQUES.map((t) => t.category)));

  // Calculate estimated time for selected techniques
  // Use 400 tokens as average (most responses are 300-600 tokens)
  const modelId = selectedModel || 'gpt-4o-mini';
  const avgTokens = 400;
  const estimatedTime =
    selectedTechniques.length > 0
      ? estimateResponseTime(modelId, avgTokens, selectedTechniques)
      : estimateResponseTime(modelId, avgTokens, []);

  const formattedTime = formatEstimatedTime(estimatedTime);

  // Calculate total API calls and validate combination
  const totalApiCalls = calculateTotalApiCalls(selectedTechniques);

  // Extract provider from model ID (format: provider/model or just model)
  let provider: string | undefined;
  if (selectedModel?.includes('/')) {
    provider = selectedModel.split('/')[0];
  } else if (selectedModel?.startsWith('gpt')) {
    provider = 'openai';
  } else if (selectedModel?.startsWith('claude')) {
    provider = 'anthropic';
  } else if (selectedModel?.startsWith('gemini')) {
    provider = 'google';
  }

  const validation = validateTechniqueCombination(selectedTechniques, provider);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 hover:shadow-md transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Advanced Techniques
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedTechniques.length > 0 && (
            <>
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">
                {selectedTechniques.length}
              </span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  validation.isValid
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'bg-red-100 dark:bg-red-900/50'
                }`}
                title={
                  validation.isValid
                    ? `${totalApiCalls} API calls`
                    : validation.warning
                }
              >
                {!validation.isValid && (
                  <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    validation.isValid
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {totalApiCalls} calls
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  ~{formattedTime}
                </span>
              </div>
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 p-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-sm max-h-[32rem] overflow-y-auto">
          {/* Rate limit warning */}
          {validation.warning && (
            <div
              className={`p-3 rounded-lg border ${
                validation.isValid
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    validation.isValid
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      validation.isValid
                        ? 'text-yellow-800 dark:text-yellow-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}
                  >
                    {validation.warning}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      validation.isValid
                        ? 'text-yellow-700 dark:text-yellow-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    Limit: {validation.limit} calls/min for{' '}
                    {provider || 'this provider'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Select OptiLLM techniques (may increase latency & cost)
            </p>
            {selectedTechniques.length > 0 && (
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                    validation.isValid
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  <span
                    className={`text-xs font-medium ${
                      validation.isValid
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {totalApiCalls} API calls
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Est. {formattedTime}
                  </span>
                </div>
              </div>
            )}
          </div>

          {categories.map((category) => {
            const categoryTechniques = TECHNIQUES.filter((t) => t.category === category);
            return (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {category}
                </h4>
                <div className="space-y-1.5">
                  {categoryTechniques.map((technique) => {
                    const isSelected = selectedTechniques.includes(technique.id);
                    
                    // Calculate if selecting this technique would exceed rate limit
                    const wouldExceedLimit = !isSelected && provider
                      ? !validateTechniqueCombination([...selectedTechniques, technique.id], provider).isValid
                      : false;

                    const techniqueApiCalls = TECHNIQUE_OVERHEAD[technique.id]?.apiCalls || 1;

                    // Determine label styling
                    let labelClassName = 'flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 border ';
                    if (wouldExceedLimit) {
                      labelClassName += 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700';
                    } else if (isSelected) {
                      labelClassName += 'cursor-pointer bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 border-primary-200 dark:border-primary-700 shadow-sm';
                    } else {
                      labelClassName += 'cursor-pointer bg-white dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm';
                    }

                    return (
                      <label
                        key={technique.id}
                        className={labelClassName}
                        title={wouldExceedLimit ? 'Adding this would exceed rate limit' : ''}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTechnique(technique.id)}
                          disabled={wouldExceedLimit}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                          aria-label={`Toggle ${technique.name}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">{technique.icon}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {technique.name}
                            </span>
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {techniqueApiCalls} {techniqueApiCalls === 1 ? 'call' : 'calls'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {technique.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
