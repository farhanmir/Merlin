'use client';

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { Send, Loader2, Clock } from 'lucide-react';
import { estimateResponseTime, formatEstimatedTime, estimateOutputTokens } from '@/lib/estimation';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading, selectedModel, selectedTechniques } = useChatStore();
  
  // Calculate estimated response time based on input
  const modelId = selectedModel || 'gpt-4o-mini';
  const estimatedTokens = input.length > 0 ? estimateOutputTokens(input) : 400;
  const estimatedTime = estimateResponseTime(modelId, estimatedTokens, selectedTechniques);
  const formattedTime = formatEstimatedTime(estimatedTime);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus-within:border-primary-500 dark:focus-within:border-primary-400 transition-colors shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="w-full resize-none bg-transparent px-4 py-3 pr-24 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none max-h-40"
              rows={1}
              style={{
                minHeight: '48px',
              }}
              disabled={isLoading}
            />
            
            {/* Estimated time indicator */}
            {input.length > 0 && (
              <div className="absolute bottom-2 left-4 flex items-center gap-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {input.length} chars
                </div>
                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    ~{formattedTime}
                  </span>
                </div>
              </div>
            )}
            
            {/* Send button */}
            <div className="absolute bottom-2 right-2">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="group relative bg-gradient-to-br from-primary-500 to-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:from-primary-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-500 disabled:hover:to-purple-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                title={isLoading ? 'Sending...' : 'Send message'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Sending</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-sm">Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Helpful hints */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <div className="flex items-center gap-4">
              <span>💡 Tip: Use advanced techniques for better results</span>
            </div>
            <div>
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Shift + Enter</kbd> for new line
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
