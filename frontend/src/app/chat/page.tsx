import { ChatInterface } from '@/components/chat/chat-interface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat - Merlin',
  description: 'Chat with AI using OptiLLM optimization techniques',
};

export default function ChatPage() {
  return <ChatInterface />;
}
