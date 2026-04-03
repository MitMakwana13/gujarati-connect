'use client';

import { useEffect } from 'react';
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
    <div className="pb-8">
      <Feed />
    </div>
  );
}
