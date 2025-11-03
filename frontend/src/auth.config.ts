import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    // Only add Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code"
              }
            }
          }),
        ]
      : []),
    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
          const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          return {
            id: data.user_id,
            email: data.email,
            accessToken: data.access_token,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/chat') || 
                      nextUrl.pathname.startsWith('/settings') ||
                      nextUrl.pathname.startsWith('/workflows') ||
                      nextUrl.pathname.startsWith('/analytics');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');

      if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/chat', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && isOnChat) {
        return false; // Redirect to sign-in page
      }

      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Store the access token from credentials provider
        if ('accessToken' in user) {
          token.accessToken = user.accessToken as string;
        }
      }
      if (account?.provider === 'google') {
        token.provider = 'google';
        // For Google OAuth, we need to create a backend user
        // This is a placeholder - you'd need to implement Google OAuth on backend
        token.id = user?.id || token.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        session.provider = token.provider as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};
