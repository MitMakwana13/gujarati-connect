'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Supabase OAuth callback handler.
 * After Google login, Supabase redirects here.
 * We detect the session and redirect to /nearby or /onboarding.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
      if (!profile?.name) {
        router.push('/onboarding');
      } else {
        router.push('/nearby');
      }
    };
    handle();
  }, [router]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div className="spin" style={{ width: 40, height: 40, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: 'rgb(245,158,11)', borderRadius: '50%' }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Signing you in…</p>
    </div>
  );
}
