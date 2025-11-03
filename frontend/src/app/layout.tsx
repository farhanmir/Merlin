import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme-provider';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Merlin - Agentic AI Workbench',
  description: 'A modern AI workbench with BYOK support and OptiLLM integration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" expand={false} richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
