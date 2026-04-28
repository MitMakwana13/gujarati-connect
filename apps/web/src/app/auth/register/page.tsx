'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const USER_TYPES = [
  { value: 'student', label: '🎓 Student' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'entrepreneur', label: '🚀 Entrepreneur' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'organizer', label: '🎉 Community Organizer' },
];

type Step = 'form' | 'verify';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', userType: '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Step 1: Register → API creates user + generates OTP stored in Redis */
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.ok) {
      setStep('verify');
    } else {
      setError(result.error ?? 'Registration failed');
    }
  }

  /** Step 2: Verify OTP → API validates, returns tokens, auto-login */
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setVerifyLoading(true);
    try {
      const res = await fetch('/api/backend/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const json = await res.json() as {
        data?: { user: Record<string, unknown>; tokens: { accessToken: string } };
        errors?: { message: string }[];
      };

      if (!res.ok) {
        setError(json.errors?.[0]?.message ?? 'Invalid or expired code.');
        return;
      }

      // Reload after verification so the auth provider restores the new session.
      const { tokens } = json.data!;
      try { sessionStorage.setItem('gg_access_token', tokens.accessToken); } catch { /* incognito */ }
      window.location.assign('/feed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-teal" style={{ width: 400, height: 400, top: -80, right: -60 }} />
        <div className="orb orb-indigo" style={{ width: 350, height: 350, bottom: -80, left: -60 }} />

        <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📨</div>
            <h1 style={{ fontSize: 26, marginBottom: 8 }}>Verify your email</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              We sent a verification code to <strong>{form.email}</strong>.
            </p>
          </div>

          <form id="verify-form" onSubmit={(e) => { void handleVerify(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'hsla(0,70%,50%,0.1)', border: '1px solid hsla(0,70%,50%,0.3)', borderRadius: 8, fontSize: 14, color: '#f87171' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="otp">6-digit verification code</label>
              <input
                id="otp"
                type="text"
                className="input"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: 8, textAlign: 'center', fontFamily: 'monospace', fontSize: 22 }}
                autoFocus
              />
            </div>

            <button id="verify-submit" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4, opacity: verifyLoading ? 0.7 : 1 }} disabled={verifyLoading || otp.length !== 6}>
              {verifyLoading ? 'Verifying…' : 'Verify & Sign In →'}
            </button>

            <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { setStep('form'); setError(''); setOtp(''); }}>
              ← Back to registration
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-saffron" style={{ width: 450, height: 450, top: -120, right: -80 }} />
      <div className="orb orb-indigo"  style={{ width: 400, height: 400, bottom: -100, left: -80 }} />

      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 480, padding: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" className="nav-logo" style={{ display: 'block', marginBottom: 8 }}>gujarati global</Link>
          <h1 style={{ fontSize: 26, marginBottom: 6 }}>Join your community</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Connect with Gujaratis worldwide — free forever</p>
        </div>

        <form id="register-form" onSubmit={(e) => { void handleRegister(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'hsla(0,70%,50%,0.1)', border: '1px solid hsla(0,70%,50%,0.3)', borderRadius: 8, fontSize: 14, color: '#f87171' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label" htmlFor="first-name">First name</label>
              <input id="first-name" type="text" className="input" placeholder="Jay" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="last-name">Last name</label>
              <input id="last-name" type="text" className="input" placeholder="Patel" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="input" placeholder="At least 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required autoComplete="new-password" minLength={8} />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="user-type">I am a...</label>
            <select id="user-type" className="input" style={{ cursor: 'pointer' }} value={form.userType} onChange={(e) => update('userType', e.target.value)}>
              <option value="">Select your profile type</option>
              {USER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <button id="register-submit" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 16 }}>
          Already a member?{' '}
          <Link href="/auth/login" style={{ color: 'var(--brand-saffron)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
