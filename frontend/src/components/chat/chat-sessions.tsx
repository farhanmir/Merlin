'use client';

import { useChatStore } from '@/lib/store';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ChatSessions() {
  const [isMounted, setIsMounted] = useState(false);
  const { sessions, currentSessionId, createNewSession, loadSession, deleteSession } = useChatStore();

  // Fix hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show placeholder during SSR
  if (!isMounted) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Chats
          </h3>
          <button
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="space-y-1">
          <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Chats
        </h3>
        <button
          onClick={createNewSession}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="New chat"
        >
          <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
            No saved chats yet
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <button
                onClick={() => loadSession(session.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{session.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {session.messages.length} messages
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                title="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
