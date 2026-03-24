'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { ConnectionService } from '@/lib/services/connection.service';
import { LocationService } from '@/lib/services/location.service';
import BottomNav from '@/components/BottomNav';
import toast from 'react-hot-toast';

type NearbyUser = {
  id: string;
  name: string | null;
  photo_url: string | null;
  profession: string | null;
  native_city: string | null;
  current_city: string | null;
  current_country: string | null;
  distance_km: number;
  is_verified?: boolean;
};

const filters = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '20 km', value: 20000 },
  { label: 'Anywhere', value: 20000 },
] as const;

export default function NearbyPage() {
  const nearbyRadius = useAppStore((s) => s.nearbyRadius);
  const setNearbyRadius = useAppStore((s) => s.setNearbyRadius);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});

  const radiusValue = useMemo(() => {
    if (nearbyRadius === 'anywhere') return 40000000;
    return nearbyRadius;
  }, [nearbyRadius]);

  useEffect(() => {
    LocationService.getCurrentLocation().then(pos => {
      setLocation({ lat: pos.lat, lng: pos.lng });
      LocationService.saveLocation(pos.lat, pos.lng);
    }).catch(() => {
      setError('Enable location to discover Gujaratis nearby.');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!location) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_nearby_users', {
        lat: location.lat,
        lng: location.lng,
        radius: radiusValue,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setUsers((data ?? []) as NearbyUser[]);
      setLoading(false);
    };

    load();
  }, [location, radiusValue]);

  const connect = async (targetUserId: string) => {
    setConnecting(prev => ({ ...prev, [targetUserId]: true }));
    try {
      await ConnectionService.sendRequest(targetUserId);
      toast.success('Connection request sent 🤝');
    } catch (e: any) {
      toast.error(e.message || 'Failed to connect');
    }
    setConnecting(prev => ({ ...prev, [targetUserId]: false }));
  };

  return (
    <main className="min-h-[100dvh] bg-[#0A0E19] px-4 pb-32 pt-5 text-slate-100 md:px-8">
      <section className="mx-auto max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[10px] font-bold tracking-[0.22em] text-amber-100 uppercase">
              Gujarati Connect
            </div>

            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl font-['Poppins']">
              Find Gujaratis nearby, anywhere in the world.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Discover trusted people around you, send a connection request, and start real conversations.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatCard label="Nearby Gujaratis" value={loading ? '...' : String(users.length)} />
              <StatCard label="Privacy mode" value="On" />
              <StatCard label="Response time" value="Instant" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          {filters.map((filter) => {
            const active = nearbyRadius === filter.value || (filter.label === 'Anywhere' && nearbyRadius === 'anywhere');
            return (
              <button
                key={filter.label}
                onClick={() => setNearbyRadius(filter.label === 'Anywhere' ? 'anywhere' : filter.value as any)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95',
                  active
                    ? 'border-amber-400/40 bg-amber-400 text-black shadow-[0_4px_15px_rgba(245,158,11,0.25)]'
                    : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
                ].join(' ')}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Header row */}
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white font-['Poppins']">Nearby people</h2>
            <p className="mt-1 text-sm text-slate-400 font-medium">
              Showing results within {nearbyRadius === 'anywhere' ? 'Anywhere' : `${(nearbyRadius as number) / 1000} km`}
            </p>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 md:block font-medium">
            Secure & location-aware
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-[24px] border border-red-400/15 bg-red-500/10 p-4 text-sm text-red-100 font-medium tracking-tight">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.map((user, idx) => (
              <motion.article
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-400/25 hover:bg-white/[0.06]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 pointer-events-none" />

                <div className="relative flex items-start gap-4 z-10">
                  <div className="relative shrink-0">
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.name || 'User'}
                        className="h-16 w-16 rounded-[20px] object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-[20px] bg-[#0A0E19] ring-1 ring-white/10 flex items-center justify-center text-xl font-bold text-slate-400">
                        {user.name?.charAt(0) || 'G'}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0A0E19] bg-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-white font-['Poppins']">
                        {user.name || 'Anonymous'}
                      </h3>
                      {user.is_verified && (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-100 uppercase tracking-widest shrink-0">
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 truncate text-[13px] font-medium text-slate-400">
                      {user.profession || 'Profession not set'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 truncate">
                      <Pill>{user.native_city || 'Gujarati'}</Pill>
                      <DistancePill>{user.distance_km} km</DistancePill>
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 flex gap-3 z-10">
                  <button
                    onClick={() => connect(user.id)}
                    disabled={connecting[user.id]}
                    className="flex-1 rounded-[18px] bg-amber-400 px-4 py-3 text-[14px] font-semibold text-black transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
                  >
                    {connecting[user.id] ? 'Connecting...' : 'Connect'}
                  </button>
                  <button className="rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-3 text-[14px] font-medium text-slate-200 transition hover:bg-white/[0.08] active:scale-95">
                    View
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
      
      <BottomNav />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-semibold text-white font-['Poppins'] tracking-tight">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium tracking-wide text-slate-300 whitespace-nowrap">
      {children}
    </span>
  );
}

function DistancePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-100 whitespace-nowrap">
      {children}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shrink-0">
      <div className="animate-[pulse_1.5s_ease-in-out_infinite]">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-[20px] bg-white/[0.06]" />
          <div className="flex-1 mt-1">
            <div className="h-5 w-32 rounded bg-white/[0.06]" />
            <div className="mt-3 h-3 w-24 rounded bg-white/[0.06]" />
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-20 rounded-full bg-white/[0.06]" />
              <div className="h-6 w-16 rounded-full bg-white/[0.06]" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <div className="h-12 flex-1 rounded-[18px] bg-white/[0.06]" />
          <div className="h-12 w-20 rounded-[18px] bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.04] p-10 py-16 text-center backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[24px] border border-amber-400/20 bg-amber-400/10 text-3xl shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        👑
      </div>
      <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-white font-['Poppins']">Be the first Gujarati here</h3>
      <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-relaxed text-slate-400">
        Invite your Gujarati friends and grow the active community in this city before anyone else.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button 
          onClick={() => {
            if (navigator.share) navigator.share({ title: 'Gujarati Connect', url: window.location.origin });
            else { navigator.clipboard.writeText(window.location.origin); toast.success('Invite link copied!'); }
          }}
          className="rounded-[18px] bg-amber-400 px-6 py-3.5 text-[14px] font-semibold text-black transition hover:bg-amber-300 active:scale-95 shadow-[0_8px_25px_rgba(245,158,11,0.25)]"
        >
          Share Invite
        </button>
      </div>
    </div>
  );
}
