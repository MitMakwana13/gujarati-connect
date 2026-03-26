'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import Feed from '@/components/Feed';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !profile?.name)) {
      router.push('/');
    }
  }, [user, profile, loading, router]);

  if (loading) return null;

  return (
    <main className="min-h-[100dvh] bg-[#0A0E19] px-4 pb-32 pt-5 text-slate-100 md:px-8">
      <section className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[10px] font-bold tracking-[0.22em] text-amber-100 uppercase mb-3">
            Gujarati Connect
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-['Poppins']">
            Your Global Feed
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            See what Gujaratis around the world are sharing right now.
          </p>
        </motion.div>

        {/* The Feed Component */}
        <Feed />

      </section>
      <BottomNav />
    </main>
  );
}
