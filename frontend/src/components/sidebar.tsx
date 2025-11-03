'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Moon, Sun, LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { SignOutButton } from '@/components/sign-out-button';

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  children?: React.ReactNode;
}

export function Sidebar({ navigationItems, children }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Link 
          href="/" 
          className="flex items-center gap-3 group transition-all duration-200"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Merlin
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">AI Workbench</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-shrink-0 px-3 py-3 space-y-0.5 border-b border-gray-200 dark:border-gray-800">{navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150
                ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Scrollable Children Section */}
      {children && (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {children}
        </div>
      )}

      {/* Theme Toggle and Sign Out */}
      <div className="flex-shrink-0 px-3 pb-4 border-t border-gray-200 dark:border-gray-800 pt-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </div>
          <span className="text-sm">
            {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode
          </span>
        </button>
        
        <SignOutButton />
      </div>
    </aside>
  );
}
