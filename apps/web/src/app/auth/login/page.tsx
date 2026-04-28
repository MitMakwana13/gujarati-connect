'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push('/feed');
    } else {
      setError(result.error ?? 'Login failed');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-saffron" style={{ width: 400, height: 400, top: -100, left: -100 }} />
      <div className="orb orb-indigo"  style={{ width: 500, height: 500, bottom: -150, right: -100 }} />

      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 420, padding: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" className="nav-logo" style={{ display: 'block', marginBottom: 8 }}>gujarati global</Link>
          <h1 style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sign in to connect with your community</p>

        </div>

        <form id="login-form" onSubmit={(e) => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'hsla(0,70%,50%,0.1)', border: '1px solid hsla(0,70%,50%,0.3)', borderRadius: 8, fontSize: 14, color: '#f87171' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ textAlign: 'right', marginTop: 4 }}>
              <Link href="/auth/forgot-password" style={{ fontSize: 13, color: 'var(--brand-indigo)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--brand-saffron)', textDecoration: 'none', fontWeight: 600 }}>
            Join free
          </Link>
        </p>
      </div>
    </div>
  );
}
