'use client';

import { Sparkles, FileText, Code, BarChart3, Lightbulb, Zap, Brain } from 'lucide-react';
import { useChatStore } from '@/lib/store';

const examplePrompts = [
  {
    icon: FileText,
    category: 'Writing',
    title: 'Write an Essay',
    prompt: 'Write a 1000-word essay about the impact of artificial intelligence on modern education',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Code,
    category: 'Development',
    title: 'Debug Code',
    prompt: 'Help me debug this Python code: [paste your code here]',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    category: 'Analysis',
    title: 'Analyze Data',
    prompt: 'Analyze this dataset and provide insights on trends and patterns',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Brain,
    category: 'Reasoning',
    title: 'Solve Complex Problems',
    prompt: 'Break down and solve: What are the long-term economic effects of renewable energy adoption?',
    gradient: 'from-orange-500 to-red-500',
  },
];

const techniques = [
  {
    name: 'PlanSearch',
    icon: '🎯',
    description: 'Strategic planning for complex queries',
  },
  {
    name: 'Chain-of-Thought',
    icon: '🤔',
    description: 'Step-by-step reasoning',
  },
  {
    name: 'Mixture-of-Agents',
    icon: '👥',
    description: 'Multiple AI perspectives',
  },
];

export function EmptyState() {
  const { sendMessage } = useChatStore();

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-12">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Welcome to Merlin AI
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your intelligent AI workbench with advanced optimization techniques
            </p>
          </div>
        </div>

        {/* Example Prompts */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Try these examples
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examplePrompts.map((example, index) => {
              const Icon = example.icon;
              return (
                <button
                  key={index}
                  onClick={() => handlePromptClick(example.prompt)}
                  className="group text-left p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-gray-800/50 hover:bg-gradient-to-br hover:from-primary-50 hover:to-purple-50 dark:hover:from-primary-900/20 dark:hover:to-purple-900/20 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${example.gradient} shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {example.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {example.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                        {example.prompt}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* OptiLLM Techniques Info */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                Supercharge Your Prompts
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Enable advanced techniques in the sidebar to boost response quality
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {techniques.map((tech, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-700/50"
              >
                <span className="text-2xl">{tech.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {tech.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {tech.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Ready to chat
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Type your message below or click an example to get started
          </p>
        </div>
      </div>
    </div>
  );
}
