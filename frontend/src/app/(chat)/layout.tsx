'use client';

import { Sidebar } from '@/components/sidebar';
import { OnboardingGuide } from '@/components/chat/onboarding-guide';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChatSessions } from '@/components/chat/chat-sessions';
import { AdvancedSettings } from '@/components/chat/advanced-settings';
import { ServerStatus } from '@/components/server-status';
import { Home, Settings, BarChart3, Workflow } from 'lucide-react';

const navigationItems = [
  { label: 'Chat', href: '/', icon: Home },
  { label: 'Workflows', href: '/workflows', icon: Workflow },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <ServerStatus />
      <div className="flex h-screen overflow-hidden">
        <Sidebar navigationItems={navigationItems}>
          <div className="space-y-4">
            <ChatSessions />
            <AdvancedSettings />
          </div>
        </Sidebar>
        <main className="flex-1 overflow-hidden">{children}</main>
        <OnboardingGuide />
      </div>
    </ErrorBoundary>
  );
}
