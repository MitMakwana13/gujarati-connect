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

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', userType: '', otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function sendOtp() {
    if (!form.email) { setError('Enter your email first'); return; }
    setOtpLoading(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate
    setOtpSent(true);
    setOtpLoading(false);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.ok) {
      router.push('/feed');
    } else {
      setError(result.error ?? 'Registration failed');
    }
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
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'hsla(175,80%,42%,0.1)', border: '1px solid hsla(175,80%,42%,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--brand-teal)' }}>
            Demo mode: OTP code is <strong>123456</strong>
          </div>
        </div>

        <form id="register-form" onSubmit={(e) => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <input id="reg-password" type="password" className="input" placeholder="At least 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required autoComplete="new-password" />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="user-type">I am a...</label>
            <select id="user-type" className="input" style={{ cursor: 'pointer' }} value={form.userType} onChange={(e) => update('userType', e.target.value)}>
              <option value="">Select your profile type</option>
              {USER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="otp">Verification code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="otp"
                type="text"
                className="input"
                placeholder="123456"
                maxLength={6}
                value={form.otp}
                onChange={(e) => update('otp', e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: 6, textAlign: 'center', fontFamily: 'monospace', fontSize: 18 }}
              />
              <button id="send-otp" type="button" className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={() => { void sendOtp(); }} disabled={otpLoading}>
                {otpSent ? '✓ Sent' : otpLoading ? '…' : 'Send OTP'}
              </button>
            </div>
            {otpSent && <p style={{ fontSize: 12, color: 'var(--brand-teal)', marginTop: 4 }}>OTP sent! In demo mode use: <strong>123456</strong></p>}
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
