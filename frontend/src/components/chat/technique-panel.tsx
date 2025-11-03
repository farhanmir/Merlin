'use client';

import { useState } from 'react';
import { useChatStore } from '@/lib/store';
import { Technique } from '@/lib/types';
import { ChevronDown, Sparkles, Zap, Clock } from 'lucide-react';
import { estimateResponseTime, formatEstimatedTime } from '@/lib/estimation';

const TECHNIQUES: Array<{
  id: Technique;
  name: string;
  description: string;
  icon: string;
  category: string;
}> = [
  // Core Reasoning Techniques
  {
    id: 'mars',
    name: 'MARS',
    description: 'Multi-Agent Reasoning System with diverse temperature exploration',
    icon: '🪐',
    category: 'Advanced',
  },
  {
    id: 'cepo',
    name: 'CePO',
    description: 'Cerebras Planning and Optimization (Best of N + CoT + Self-Reflection)',
    icon: '🧠',
    category: 'Advanced',
  },
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
  {
    id: 'z3',
    name: 'Z3 Solver',
    description: 'Formal logic using Z3 theorem prover',
    icon: '🔬',
    category: 'Logic',
  },
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
  const estimatedTime = selectedTechniques.length > 0
    ? estimateResponseTime(modelId, avgTokens, selectedTechniques)
    : estimateResponseTime(modelId, avgTokens, []);
  
  const formattedTime = formatEstimatedTime(estimatedTime);

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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Select OptiLLM techniques (may increase latency & cost)
            </p>
            {selectedTechniques.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Est. {formattedTime}
                </span>
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
                    return (
                      <label
                        key={technique.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 border-primary-200 dark:border-primary-700 shadow-sm'
                            : 'bg-white dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTechnique(technique.id)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{technique.icon}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {technique.name}
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
