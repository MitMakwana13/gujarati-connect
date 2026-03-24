'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { LogOut } from 'lucide-react';
import { getInitials } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  if (!user || !profile) return null;

  return (
    <main className="min-h-[100dvh] px-4 pt-6 pb-32 bg-[#0A0E19] text-white">
      <section className="max-w-md mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold font-['Poppins'] tracking-tight">Your Identity</h1>
          <button 
            onClick={() => { signOut(); router.push('/'); }}
            className="p-2 text-slate-400 hover:text-white bg-white/[0.04] rounded-xl hover:bg-white/[0.08] transition active:scale-95"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 pointer-events-none" />

          {profile.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-24 h-24 mx-auto border-2 border-white/10 rounded-[28px] object-cover shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative z-10" />
          ) : (
            <div className="w-24 h-24 mx-auto rounded-[28px] border-2 border-white/10 bg-[#0A0E19] shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center justify-center font-bold text-3xl text-slate-400 relative z-10">
              {getInitials(profile.name)}
            </div>
          )}

          <h2 className="text-[22px] font-semibold tracking-tight mt-5 font-['Poppins'] relative z-10">{profile.name}</h2>
          <p className="text-slate-400 font-medium text-[15px] mt-1 relative z-10">{profile.profession || 'Professional'}</p>

          <div className="flex justify-center gap-2 mt-5 relative z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[12px] font-medium tracking-wide text-slate-200">
              {profile.native_city || 'Gujarat'}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[12px] font-semibold tracking-wide text-amber-100">
              {profile.current_city || profile.current_country || 'Earth'}
            </span>
          </div>

          <button 
            onClick={() => router.push('/profile/edit')}
            className="mt-8 w-full bg-amber-400 py-3.5 rounded-[18px] font-semibold text-black transition hover:bg-amber-300 active:scale-95 shadow-[0_8px_25px_rgba(245,158,11,0.25)] relative z-10"
          >
            Edit Profile
          </button>
        </div>

        {/* Setting toggles could be added here in future mvp stages */}
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
           <div className="flex justify-between items-center">
             <div className="font-medium text-[15px]">Privacy Mode</div>
             <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${profile.privacy_mode ? 'bg-[#22c55e]' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profile.privacy_mode ? 'translate-x-6' : 'translate-x-0'}`} />
             </div>
           </div>
           <p className="text-xs text-slate-400 mt-2">Hides your exact distance (fuzzed location within 500m area).</p>
        </div>

      </section>
      <BottomNav />
    </main>
  );
}
