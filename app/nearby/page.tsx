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
      <div className="flex gap-2 px-5 mb-5 mt-2">
        <div className="stat-card">
          <div className="stat-num">2.4M</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">186</div>
          <div className="stat-label">Countries</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-num">{loading ? '...' : users.length}</div>
          <div className="stat-label">Nearby</div>
        </div>
      </div>

      <div className="sec-title px-5">Global Gujarati Map</div>
      <div className="px-5 mb-3">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] h-[185px] overflow-hidden relative">
          <svg className="w-full h-full" viewBox="0 0 400 185" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="0.5"/>
              </pattern>
              <radialGradient id="glow-saffron" cx="50%" cy="50%"><stop offset="0%" stopColor="#E8892A" stopOpacity="0.3"/><stop offset="100%" stopColor="#E8892A" stopOpacity="0"/></radialGradient>
            </defs>
            <rect width="400" height="185" fill="#10141A"/>
            <rect width="400" height="185" fill="url(#grid)"/>
            
            {/* World Map Paths (Simplified) */}
            <path d="M60,55 Q70,48 85,50 L95,52 Q100,56 98,62 L92,68 Q88,72 82,70 L72,64 Q64,60 60,55Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            <path d="M155,38 Q175,30 210,34 L250,40 Q270,48 280,55 L290,70 Q295,85 285,95 L270,100 Q260,98 250,90 L240,80 Q230,72 220,68 L200,60 Q180,52 165,48 L155,42Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            
            {/* Connection Lines */}
            <line x1="246" y1="68" x2="168" y2="40" stroke="rgba(232,137,42,0.08)" strokeWidth="0.5" strokeDasharray="3,3"/>
            
            {/* Animated Pin (Mumbai/India Focus) */}
            <g className="cursor-pointer">
              <circle cx="246" cy="68" r="16" fill="url(#glow-saffron)">
                <animate attributeName="r" values="14;20;14" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="246" cy="68" r="5" fill="#E8892A" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </div>

      {/* Radius Control */}
      <div className="px-5 mb-5 mt-2">
        <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-[12px] padding px-4 py-2.5">
          <span className="text-[11px] text-[var(--text2)] font-medium whitespace-nowrap">📍 Discovery radius</span>
          <input 
            type="range" 
            className="flex-1 h-1 bg-gradient-to-r from-[var(--saffron)] to-[var(--teal)] rounded-full appearance-none cursor-pointer accent-[var(--saffron)]" 
            min="1000" 
            max="20000" 
            step="1000"
            value={typeof nearbyRadius === 'number' ? nearbyRadius : 5000}
            onChange={(e) => setNearbyRadius(parseInt(e.target.value) as any)}
          />
          <span className="font-serif text-[15px] font-bold text-[var(--saffron)] min-w-[46px] text-right">
            {typeof nearbyRadius === 'number' ? nearbyRadius / 1000 : 5} km
          </span>
        </div>
      </div>

      {/* People Grid */}
      <div className="sec-title px-5">People nearby</div>
      <div className="grid grid-cols-2 gap-2.5 px-5 mb-8">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-[180px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] animate-pulse" />
          ))
        ) : (
          users.map((user, idx) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] p-4 flex flex-col transition-all hover:border-[var(--border2)] group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-br from-[rgba(232,137,42,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-dark)] flex items-center justify-center text-sm font-bold text-white mb-2.5 shadow-lg relative z-10">
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name?.charAt(0) || 'G'
                )}
              </div>
              <div className="text-[13px] font-bold text-[var(--text)] mb-0.5 truncate relative z-10">{user.name || 'Anonymous'}</div>
              <div className="text-[11px] text-[var(--text2)] mb-1 truncate relative z-10">{user.current_city || 'City Unknown'}</div>
              <div className="text-[11px] font-bold text-[var(--saffron)] mb-2.5 relative z-10">📍 {user.distance_km.toFixed(1)} km</div>
              
              <button 
                onClick={() => connect(user.id)}
                disabled={connecting[user.id]}
                className="w-full h-[34px] rounded-[10px] border border-[var(--border2)] text-[12px] font-bold text-[var(--text)] hover:bg-[var(--saffron)] hover:border-[var(--saffron)] hover:text-white transition-all relative z-10"
              >
                {connecting[user.id] ? '...' : '+ Connect'}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Business Directory */}
      <div className="sec-title px-5 mt-4">Business Directory</div>
      <div className="px-5 space-y-2.5 mb-8">
        <div className="biz-card">
          <div className="w-12 h-12 rounded-[12px] bg-[rgba(232,137,42,0.1)] flex items-center justify-center text-2xl shrink-0">💎</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[var(--text)] mb-0.5">Shah Diamond Trading</div>
            <div className="text-[11px] text-[var(--saffron)] font-semibold mb-1">Diamond & Jewelry</div>
            <div className="text-[11px] text-[var(--text2)] leading-relaxed line-clamp-2">3rd generation Surat diamond business, now in Antwerp & Dubai</div>
            <div className="flex gap-2 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[rgba(26,174,163,0.1)] text-[var(--teal-light)] border border-[rgba(26,174,163,0.2)] font-bold">✓ Verified</span>
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[rgba(232,137,42,0.1)] text-[var(--saffron)] border border-[rgba(232,137,42,0.2)] font-bold">★ 4.9</span>
            </div>
          </div>
        </div>
        <div className="biz-card">
          <div className="w-12 h-12 rounded-[12px] bg-[rgba(26,174,163,0.1)] flex items-center justify-center text-2xl shrink-0">🏗️</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[var(--text)] mb-0.5">Patel Infrastructure Ltd</div>
            <div className="text-[11px] text-[var(--saffron)] font-semibold mb-1">Construction & Real Estate</div>
            <div className="text-[11px] text-[var(--text2)] leading-relaxed line-clamp-2">Commercial & residential projects across Gujarat & Maharashtra</div>
            <div className="flex gap-2 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[rgba(26,174,163,0.1)] text-[var(--teal-light)] border border-[rgba(26,174,163,0.2)] font-bold">✓ Verified</span>
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[rgba(232,137,42,0.1)] text-[var(--saffron)] border border-[rgba(232,137,42,0.2)] font-bold">★ 4.7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
