import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.errors?.[0]?.message || 'Login failed');
          const { user, tokens } = json.data;
          return {
            id: user.id,
            email: user.email,
            name: user.display_name,
            role: user.role,
            avatar: user.avatar_url,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          };
        } catch (error) {
          console.error('Auth Error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          expiresAt: (user as any).expiresAt,
          role: (user as any).role,
          avatar: (user as any).avatar,
        };
      }
      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }
      // Token expired — attempt silent refresh
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        });
        const data = await res.json();
        if (!res.ok) throw data;
        return {
          ...token,
          accessToken: data.data.tokens.accessToken,
          refreshToken: data.data.tokens.refreshToken ?? token.refreshToken,
          expiresAt: data.data.tokens.expiresAt,
        };
      } catch {
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session.user as any).id = token.sub;
      (session.user as any).role = token.role;
      (session.user as any).avatar = token.avatar;
      return session;
    },
  },
  pages: { signIn: '/auth/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev-only-gg',
});
