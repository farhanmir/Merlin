'use client';

import { Message } from './message';
import type { Message as MessageType } from '@/lib/types';
import { useChatStore } from '@/lib/store';

interface MessageListProps {
  messages: MessageType[];
}

export function MessageList({ messages }: MessageListProps) {
  const { retryMessage } = useChatStore();

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {messages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
          isError={message.isError}
          onRetry={message.isError ? () => retryMessage(message.id) : undefined}
        />
      ))}
    </div>
  );
}
