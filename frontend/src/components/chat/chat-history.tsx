'use client';

import { useChatStore } from '@/lib/store';
import { MessageSquare, Plus } from 'lucide-react';

export function ChatHistory() {
  const { sessions, currentSessionId, loadSession, createNewSession } = useChatStore();

  return (
    <div className="space-y-3">
      {/* New Chat Button */}
      <button
        onClick={createNewSession}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-150 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">New Chat</span>
      </button>

      {/* Chat History */}
      {sessions.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
            Chat History
          </h3>
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            
            return (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`
                  w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left
                  ${
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {session.title || 'New Chat'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="px-3 py-8 text-center">
          <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No chat history yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Start a conversation to see it here
          </p>
        </div>
      )}
    </div>
  );
}
