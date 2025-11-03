'use client';

import { Sidebar } from '@/components/sidebar';
import { Key, Info, Home } from 'lucide-react';

const navigationItems = [
  { label: 'Back to Chat', href: '/chat', icon: Home },
  { label: 'API Keys', href: '/settings', icon: Key },
  { label: 'About', href: '/settings/about', icon: Info },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navigationItems={navigationItems}>
        <div className="mt-6">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Settings
          </h3>
        </div>
      </Sidebar>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
