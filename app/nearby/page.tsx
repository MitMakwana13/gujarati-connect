'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { ConnectionService } from '@/lib/services/connection.service';
import { LocationService } from '@/lib/services/location.service';
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
    <div className="pb-8">
      {/* Discover Stats */}
      <div className="sec-title px-5 mb-3">Discover Stats</div>
      <div className="flex gap-2.5 px-5 mb-6">
        <div className="stat-card">
          <div className="stat-num">{loading ? '...' : users.length}</div>
          <div className="stat-label">NEARBY</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">128</div>
          <div className="stat-label">ACTIVE</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">42</div>
          <div className="stat-label">GROUPS</div>
        </div>
      </div>

      {/* Map Zone */}
      <div className="px-5 mb-7">
        <div className="map-zone h-[180px] p-5">
          <div className="text-[13px] font-bold text-[var(--text)] mb-1">Live Map View</div>
          <div className="text-[11px] text-[var(--text2)] mb-4">Finding Gujaratis in {nearbyRadius === 'anywhere' ? 'your area' : `${((nearbyRadius as any) / 1000).toFixed(0)}km` }...</div>
          <button className="bg-[var(--saffron)] text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg">
            EXPAND MAP
          </button>
        </div>
      </div>

      {/* People Grid */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="sec-title !mb-0">People You May Know</div>
        <div className="text-[11px] font-bold text-[var(--saffron)] cursor-pointer">SEE ALL</div>
      </div>

      <div className="people-grid grid grid-cols-2 gap-3 px-5 mb-8">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-[160px] bg-[var(--surface2)] rounded-[var(--radius)] animate-pulse" />
          ))
        ) : (
          users.map((user, idx) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="person-card flex flex-col items-center text-center p-3.5"
            >
              <div 
                className="w-16 h-16 rounded-full border-2 border-[var(--border)] mb-3 p-1 shrink-0 overflow-hidden"
                style={{ borderColor: idx % 3 === 0 ? 'var(--saffron)' : 'var(--border)' }}
              >
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--surface3)] flex items-center justify-center text-lg font-bold">
                    {user.name?.charAt(0) || 'G'}
                  </div>
                )}
              </div>
              <div className="text-[13px] font-bold text-[var(--text)] truncate w-full mb-0.5">{user.name || 'Anonymous'}</div>
              <div className="text-[10px] text-[var(--text2)] truncate w-full mb-2.5 uppercase tracking-tighter">{user.profession || 'Gujarati Professional'}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); connect(user.id); }}
                disabled={connecting[user.id]}
                className="w-full py-1.5 rounded-lg bg-[var(--surface3)] border border-[var(--border)] text-[11px] font-bold text-[var(--text)] transition-colors hover:bg-[var(--saffron)] hover:text-white"
              >
                {connecting[user.id] ? '...' : 'CONNECT'}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 mb-8">
        <button className="w-full h-[54px] bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--radius)] flex items-center justify-between px-5 group hover:border-[var(--saffron)] transition-all">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏘️</span>
            <div className="text-left">
              <div className="text-[13px] font-bold text-[var(--text)]">Top Communities</div>
              <div className="text-[10px] text-[var(--text3)] uppercase">Join 12+ active groups</div>
            </div>
          </div>
          <span className="text-[var(--text3)] group-hover:text-[var(--saffron)]">→</span>
        </button>
      </div>

      {error && (
        <div className="mx-5 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-200 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
