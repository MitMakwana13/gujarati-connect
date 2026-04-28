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
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'gg_access_token';

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

/** Store access token in sessionStorage so it survives page refreshes within a tab */
function saveToken(token: string) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* incognito */ }
}
function loadToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: restore session by validating stored token against /me
  useEffect(() => {
    const token = loadToken();
    if (!token) { setIsLoading(false); return; }

    void fetch('/api/backend/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) { clearToken(); return; }
        const json = await res.json() as { data: Record<string, unknown> };
        if (json?.data) setUser(parseUser(json.data));
      })
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/backend/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      saveToken(tokens.accessToken);
      setUser(parseUser(rawUser));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error — is the API running?' };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
