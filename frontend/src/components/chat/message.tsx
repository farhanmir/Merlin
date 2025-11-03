'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Copy, Check, Sparkles } from 'lucide-react';

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function Message({ role, content, timestamp }: Readonly<MessageProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';

  return (
    <div className={`group flex gap-4 px-6 py-6 ${isUser ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-purple-600'
              : 'bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800'
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isUser ? 'You' : 'Merlin AI'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const isInline = !match;
                  
                  return isInline ? (
                    <code
                      className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <div className="relative group/code">
                      <div className="absolute right-2 top-2 z-10">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(codeString);
                          }}
                          className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark as any}
                        language={match ? match[1] : 'text'}
                        PreTag="div"
                        className="rounded-lg !mt-2"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
