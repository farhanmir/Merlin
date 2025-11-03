import type { Metadata } from 'next';
import { Sparkles, Github, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About - Merlin',
  description: 'About Merlin AI Workbench',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-primary-600" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Merlin AI Workbench
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A powerful BYOK (Bring-Your-Own-Key) AI platform with advanced inference optimization
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Features
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span><strong>OptiLLM Integration:</strong> Advanced inference techniques like Mixture-of-Agents, PlanSearch, and Chain-of-Thought</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span><strong>Multi-Provider Support:</strong> OpenAI, Anthropic, and Google Gemini models</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span><strong>Secure API Keys:</strong> All keys are encrypted with AES-128-CBC before storage</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span><strong>Streaming Responses:</strong> Real-time SSE streaming for instant feedback</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span><strong>Chat History:</strong> Persistent conversation storage with SQLite</span>
            </li>
          </ul>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Frontend</h3>
              <ul className="space-y-1">
                <li>• Next.js 16</li>
                <li>• React 19</li>
                <li>• Tailwind CSS</li>
                <li>• Zustand</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Backend</h3>
              <ul className="space-y-1">
                <li>• FastAPI</li>
                <li>• Python 3.13</li>
                <li>• SQLAlchemy</li>
                <li>• OptiLLM</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Version Information
          </h2>
          <dl className="space-y-2 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <dt className="font-medium">Version:</dt>
              <dd>0.1.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Build Date:</dt>
              <dd>November 2025</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">License:</dt>
              <dd>MIT</dd>
            </div>
          </dl>
        </section>

        <section className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-750 rounded-lg border border-primary-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Made with passion
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Merlin is an open-source project built to demonstrate advanced AI engineering patterns
            and inference optimization techniques.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </section>
      </div>
    </div>
  );
}
