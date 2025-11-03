export { auth as middleware } from '@/auth';

export const config = {
  // Only protect authenticated app routes, allow landing page and public routes
  matcher: [
    '/chat/:path*',
    '/(settings)/:path*',
    '/(workflows)/:path*',
  ],
};
