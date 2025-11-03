'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export function ServerStatus() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [attempt, setAttempt] = useState(0);
  const maxAttempts = 30; // 30 seconds total (1 check per second)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per request

        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (response.ok && isMounted) {
          setStatus('healthy');
          return true;
        }
      } catch (error) {
        console.log('Health check failed, retrying...', error);
      }

      if (isMounted) {
        setAttempt(prev => prev + 1);
      }
      return false;
    };

    const pollHealth = async () => {
      const isHealthy = await checkHealth();
      
      if (!isHealthy && attempt < maxAttempts && isMounted) {
        timeoutId = setTimeout(pollHealth, 1000); // Retry every 1 second
      } else if (attempt >= maxAttempts && isMounted) {
        setStatus('error');
      }
    };

    pollHealth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [attempt]);

  if (status === 'healthy') {
    return null; // Don't show anything when server is healthy
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
          </div>

          {/* Status */}
          <div className="text-center space-y-4">
            {status === 'checking' && (
              <>
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Waking up servers...
                  </h2>
                  <p className="text-slate-400 text-sm">
                    This may take up to 30 seconds on first load
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${(attempt / maxAttempts) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{attempt}s</span>
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Server Timeout
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Unable to connect to the server. Please try refreshing the page.
                  </p>
                  <button
                    onClick={() => globalThis.location.reload()}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Render free tier servers sleep after inactivity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
