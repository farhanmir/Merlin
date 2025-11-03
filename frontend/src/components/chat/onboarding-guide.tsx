'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Sparkles, Key, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: Key,
    title: 'Add Your API Keys',
    description: 'Go to Settings to securely add your OpenAI, Anthropic, or Google API keys. Keys are encrypted and stored locally.',
    action: 'Go to Settings',
    href: '/settings',
  },
  {
    icon: MessageSquare,
    title: 'Select a Model',
    description: 'Choose your preferred AI model from the dropdown. Each provider offers different capabilities and pricing.',
    action: null,
    href: null,
  },
  {
    icon: Zap,
    title: 'Enable OptiLLM Techniques',
    description: 'Boost response quality with advanced techniques like Chain-of-Thought, Mixture-of-Agents, or PlanSearch.',
    action: null,
    href: null,
  },
  {
    icon: Sparkles,
    title: 'Start Chatting',
    description: 'Type your message or click an example prompt to begin. Merlin will optimize your requests automatically.',
    action: null,
    href: null,
  },
];

export function OnboardingGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the guide before
    const hasSeenGuide = localStorage.getItem('merlin-has-seen-guide');
    if (!hasSeenGuide) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('merlin-has-seen-guide', 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          aria-label="Close guide"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Step Counter */}
          <div className="mb-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Action Button (if applicable) */}
          {step.action && step.href && (
            <Link
              href={step.href}
              onClick={handleClose}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-gradient-to-r from-primary-500 to-purple-600 text-white font-medium hover:from-primary-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              {step.action}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-1.5">
              {steps.map((_, index) => (
                <button
                  key={`step-${index}`}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-primary-600 w-6'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all shadow-sm"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        {/* Skip Button */}
        <div className="px-8 pb-6">
          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
