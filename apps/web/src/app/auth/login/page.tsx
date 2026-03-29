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
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'hsla(175,80%,42%,0.1)', border: '1px solid hsla(175,80%,42%,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--brand-teal)' }}>
            Demo mode: use any email + password (min 4 chars)
          </div>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div className="divider" style={{ flex: 1 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Or continue with</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="google-login"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => {
              setEmail('demo@gujaratiglobal.com');
              setPassword('demo1234');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            Use Demo Account
          </button>
        </div>

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
