'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Props { onClose: () => void; }

export default function AuthModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/nearby` },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div 
          initial={{ y: '100%' }} 
          animate={{ y: 0 }} 
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[32px] p-8 shadow-2xl relative"
        >
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text3)] hover:text-[var(--text)] transition-colors">
            <X size={18} />
          </button>

          <div className="mb-8 mt-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--saffron)] to-[#c46c10] rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-6">
              🪔
            </div>
            <h2 className="text-3xl font-bold font-serif text-[var(--text)] leading-tight">
              Welcome to<br />Gujarati Connect
            </h2>
            <p className="text-sm text-[var(--text2)] mt-3 leading-relaxed">
              Find Gujaratis near you, anywhere in the world.
            </p>
          </div>

          <button 
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all" 
            onClick={handleGoogleLogin} 
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <p className="text-[10px] text-[var(--text3)] text-center mt-8 uppercase tracking-widest font-bold">
            Secure · verified · community
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
