import { motion } from 'framer-motion';
import { MapPin, Briefcase } from 'lucide-react';
import { NearbyUser, getInitials } from '@/lib/supabase';

type Status = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export default function UserCard({ user, index, connectionStatus, onConnect }: { user: NearbyUser, index: number, connectionStatus: Status, onConnect: () => void }) {
  const isPending = connectionStatus === 'pending_sent';
  const isReceived = connectionStatus === 'pending_received';
  const isConnected = connectionStatus === 'accepted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative p-5 rounded-[28px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] hover:border-[#f59e0b]/30 mb-4"
    >
      <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#f59e0b]/5 to-transparent transition duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="relative shrink-0">
          {user.photo_url ? (
            <img src={user.photo_url} alt={user.name || ''} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#0a0e19] border border-white/10 flex items-center justify-center font-bold text-lg text-[#94a3b8]">
              {getInitials(user.name)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#22c55e] border-2 border-[#0a0e19] rounded-full shadow-sm" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-base truncate">{user.name || 'Gujarati Member'}</div>
            <div className="text-xs font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full shrink-0 ml-2 border border-[#f59e0b]/20">
              {user.distance_km} km
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1 truncate">
            <Briefcase size={13} className="shrink-0 text-white/40" />
            <span className="truncate">{user.profession || 'Professional'}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-[#94a3b8] truncate">
            <MapPin size={13} className="shrink-0 text-white/40" />
            <span className="truncate">From {user.native_city || 'Gujarat'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] relative z-10">
        <button
          onClick={onConnect}
          disabled={isPending || isConnected}
          className={`w-full ${
            isConnected
              ? 'btn-glass text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10'
              : isPending
              ? 'btn-glass bg-white/[0.08] text-white/60'
              : isReceived
              ? 'btn-primary shadow-[0_4px_20px_rgba(245,158,11,0.3)]'
              : 'btn-glass hover:text-[#f59e0b] hover:border-[#f59e0b]/50'
          }`}
        >
          {isConnected ? '✓ Connected' : isPending ? 'Request Sent' : isReceived ? 'Accept Request' : 'Connect'}
        </button>
      </div>
    </motion.div>
  );
}
