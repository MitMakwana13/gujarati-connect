'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarInitials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: string;
  otp: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isLoading = status === 'loading';
  const user = session?.user ? {
    id: (session.user as any).id,
    email: session.user.email!,
    displayName: session.user.name!,
    role: (session.user as any).role,
    avatarInitials: session.user.name!.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
  } : null;

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        return { ok: false, error: result.error };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Network error occurred during login.' };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      // Proxy through Next.js BFF to hit Fastify /register
      const res = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: `${data.firstName} ${data.lastName}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { ok: false, error: resData.errors?.[0]?.message ?? 'Registration failed.' };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Network error occurred during registration.' };
    }
  }, []);

  const logout = useCallback(() => {
    signOut({ redirect: true, callbackUrl: '/' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
