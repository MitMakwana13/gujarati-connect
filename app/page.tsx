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

  if (loading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-174px)] px-7 text-center overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-20 h-20 bg-gradient-to-br from-[var(--saffron)] to-[#c46c10] rounded-3xl flex items-center justify-center text-4xl shadow-xl mb-8 shrink-0"
      >
        🪔
      </motion.div>
      
      <h1 className="text-4xl font-bold font-serif text-[var(--text)] mb-4 leading-tight">
        Connect with your <span className="text-[var(--saffron)] italic">Samaaj</span> anywhere.
      </h1>
      
      <p className="text-sm text-[var(--text2)] mb-10 leading-relaxed max-w-[280px]">
        The premium platform for Gujaratis to find community, events, and business connections worldwide.
      </p>

      <div className="w-full space-y-3.5 mb-12">
        <button 
          onClick={() => setShowAuth(true)}
          className="w-full bg-[var(--saffron)] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[rgba(232,137,42,0.3)] active:scale-[0.98] transition-all"
        >
          GET STARTED
        </button>
        <button 
          onClick={() => setShowAuth(true)}
          className="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] font-bold py-4 rounded-2xl active:scale-[0.98] transition-all"
        >
          LOG IN
        </button>
      </div>

      <div className="flex gap-8 mb-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">📍</span>
          <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest">Nearby</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">🤝</span>
          <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest">Connect</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">🏟️</span>
          <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest">Events</span>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
