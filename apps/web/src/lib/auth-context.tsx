'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken, clearAccessToken } from './auth-token';

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
  verifyOtp: (email: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function makeInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function parseUser(raw: Record<string, unknown>): AuthUser {
  const name = (raw['display_name'] ?? raw['name'] ?? raw['email'] ?? 'User') as string;
  return {
    id: raw['id'] as string,
    email: raw['email'] as string,
    displayName: name,
    role: (raw['role'] ?? 'user') as string,
    avatarInitials: makeInitials(name),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // App boot rehydration: call /refresh to restore session from HttpOnly cookie
  useEffect(() => {
    fetch('/api/backend/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: '{}' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Refresh failed');
        const json = await res.json();
        const token = json?.data?.tokens?.accessToken;
        if (!token) throw new Error('No token returned');
        
        setAccessToken(token);

        // Fetch user data with the new token
        const userRes = await fetch('/api/backend/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userJson = await userRes.json();
        if (userJson?.data) setUser(parseUser(userJson.data));
      })
      .catch(() => {
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/backend/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json() as {
        data?: { user: Record<string, unknown>; tokens: { accessToken: string } };
        errors?: { message: string }[];
      };

      if (!res.ok) {
        return { ok: false, error: json.errors?.[0]?.message ?? 'Invalid email or password' };
      }

      const { user: rawUser, tokens } = json.data!;
      setAccessToken(tokens.accessToken);
      setUser(parseUser(rawUser));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: `${data.firstName} ${data.lastName}`,
        }),
      });
      const json = await res.json() as { errors?: { message: string }[] };
      if (!res.ok) {
        return { ok: false, error: json.errors?.[0]?.message ?? 'Registration failed' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error during registration' };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      const res = await fetch('/api/backend/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json() as {
        data?: { user: Record<string, unknown>; tokens: { accessToken: string } };
        errors?: { message: string }[];
      };
      if (!res.ok) {
        return { ok: false, error: json.errors?.[0]?.message ?? 'Invalid or expired code.' };
      }
      const { user: rawUser, tokens } = json.data!;
      setAccessToken(tokens.accessToken);
      setUser(parseUser(rawUser));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    fetch('/api/backend/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => {
        clearAccessToken();
        setUser(null);
        router.push('/');
      });
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
