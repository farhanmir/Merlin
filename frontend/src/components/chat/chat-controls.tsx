'use client';

import { Trash2, Download, FileText, FileJson } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export function ChatControls() {
  const [isMounted, setIsMounted] = useState(false);
  const { messages, clearMessages, exportAsMarkdown, exportAsJSON, getMessageCount } = useChatStore();
  
  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const messageCount = getMessageCount();
  const hasMessages = messageCount > 0;

  const handleClear = () => {
    if (!hasMessages) return;
    
    if (window.confirm(`Are you sure you want to clear all ${messageCount} messages? This cannot be undone.`)) {
      clearMessages();
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!hasMessages) {
      toast.error('No messages to export');
      return;
    }

    try {
      const markdown = exportAsMarkdown();
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(markdown, `merlin-chat-${timestamp}.md`, 'text/markdown');
      toast.success('Chat exported as Markdown');
    } catch (error) {
      toast.error('Failed to export chat');
      console.error(error);
    }
  };

  const handleExportJSON = () => {
    if (!hasMessages) {
      toast.error('No messages to export');
      return;
    }

    try {
      const json = exportAsJSON();
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(json, `merlin-chat-${timestamp}.json`, 'application/json');
      toast.success('Chat exported as JSON');
    } catch (error) {
      toast.error('Failed to export chat');
      console.error(error);
    }
  };

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  if (!hasMessages) {
    return null; // Hide controls when there are no messages
  }

  return (
    <div className="flex items-center gap-2">
      {/* Message Count Badge */}
      <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Export Dropdown */}
      <div className="relative group">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        
        {/* Dropdown Menu */}
        <div className="absolute right-0 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <button
              onClick={handleExportMarkdown}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export as Markdown</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-100 dark:border-gray-700"
            >
              <FileJson className="w-4 h-4" />
              <span>Export as JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clear Chat Button */}
      <button
        onClick={handleClear}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Clear
      </button>
    </div>
  );
}
