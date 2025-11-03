'use client';

import Link from 'next/link';
import { Sparkles, Zap, Shield, Code2, ArrowRight, Github, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: 'OptiLLM Integration',
      description: 'Leverage advanced inference techniques like Mixture-of-Agents, Chain-of-Thought, and PlanSearch for superior AI responses.',
    },
    {
      icon: Shield,
      title: 'Bring Your Own Keys',
      description: 'Complete data ownership. Your API keys, encrypted and stored securely. No vendor lock-in, no hidden costs.',
    },
    {
      icon: Code2,
      title: 'Multi-Model Support',
      description: 'OpenAI, Anthropic, Google Gemini - all in one place. Switch between models seamlessly.',
    },
    {
      icon: Sparkles,
      title: 'Per-User Isolation',
      description: 'Enterprise-grade authentication with JWT. Your chats, your keys, completely isolated and secure.',
    },
  ];

  const techniques = [
    'Mixture-of-Agents (MoA)',
    'Chain-of-Thought Reflection',
    'PlanSearch',
    'Self-Consistency',
    'MARS (Multi-Agent RAG)',
    'Best-of-N Sampling',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold text-white">Merlin AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/farhanmir/Merlin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link
              href="/chat"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Powered by OptiLLM</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Supercharge Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Workflows
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Merlin combines cutting-edge inference optimization with secure, multi-user chat.
              Bring your own API keys and unlock advanced AI techniques for 2-3x better responses.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/chat"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 text-lg font-semibold"
              >
                Start Chatting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/farhanmir/Merlin"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-2 text-lg"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10+</div>
                <div className="text-sm text-slate-400">OptiLLM Techniques</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">3</div>
                <div className="text-sm text-slate-400">LLM Providers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-sm text-slate-400">Data Ownership</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Merlin?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Built for developers who demand control, security, and cutting-edge AI performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Techniques Section */}
      <section className="relative py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Advanced Inference Techniques
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Apply state-of-the-art optimization methods to any LLM for dramatically improved reasoning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {techniques.map((technique, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-purple-500/50 transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300">{technique}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative p-12 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-xl" />
            
            <div className="relative space-y-6">
              <h2 className="text-4xl font-bold text-white">
                Ready to Transform Your AI Conversations?
              </h2>
              <p className="text-xl text-slate-300">
                Start using Merlin today. Bring your API keys and experience the difference.
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl text-lg font-semibold"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">M</span>
              </div>
              <span className="text-sm">© 2025 Merlin AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/farhanmir/Merlin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
