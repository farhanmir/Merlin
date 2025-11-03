'use client';

import { MessageSquare, Clock, Zap } from 'lucide-react';
import { useChatStore } from '@/lib/store';

export function ChatStats() {
  const { messages, selectedTechniques } = useChatStore();
  
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;

  if (messageCount === 0) {
    return null;
  }

  // Get session start time safely
  const firstMessage = messages[0];
  const sessionStart = firstMessage?.timestamp 
    ? new Date(firstMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <div className="px-3 py-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4">
        Session Stats
      </h3>
      
      <div className="space-y-2">
        {/* Total Messages */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {messageCount} Total
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {userMessages} sent · {assistantMessages} received
            </div>
          </div>
        </div>

        {/* Active Techniques */}
        {selectedTechniques.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {selectedTechniques.length} Technique{selectedTechniques.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Active
              </div>
            </div>
          </div>
        )}

        {/* Session Duration (if there are messages) */}
        {messages.length >= 2 && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                Active Session
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Started {sessionStart}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
