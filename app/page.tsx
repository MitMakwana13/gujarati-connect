'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user && profile?.name) {
        router.push('/nearby');
      } else if (user && !profile?.name) {
        router.push('/onboarding');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) return (
    <div className="hero-gradient" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
    </div>
  );

  return (
    <>
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #FF6B00 0%, #D95A00 35%, #1A1A2E 100%)' }}>

        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', top: 40, right: 20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 80, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🧡</span>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.01em' }}>
            Gujarati Connect
          </span>
        </div>

        {/* Hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px 60px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginBottom: 12, textTransform: 'uppercase' }}>
              🌍 Gujaratis Worldwide
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 9vw, 44px)', color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
              Find Gujaratis<br />Near You,<br />
              <span style={{ color: '#FFD580' }}>Anywhere</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.6, marginBottom: 40, maxWidth: 320 }}>
              Connect with Gujarati people in your city or across the world. New country? Find your <em>aapnanaa</em> in minutes. 🤝
            </p>

            <motion.button
              className="btn btn-full"
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAuth(true)}
              style={{ background: '#fff', color: '#D95A00', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.25)', marginBottom: 16 }}
            >
              🚀 Get Started — It&apos;s Free
            </motion.button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => setShowAuth(true)}
              style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}
            >
              Already have an account? Sign in
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ marginTop: 48, display: 'flex', gap: 24 }}
          >
            {[
              { emoji: '📍', label: 'GPS Discovery' },
              { emoji: '💬', label: 'Instant Chat' },
              { emoji: '🔒', label: 'Privacy First' },
            ].map((f) => (
              <div key={f.label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{f.emoji}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{f.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
