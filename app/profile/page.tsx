'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { LogOut, MapPin, Briefcase, Award } from 'lucide-react';
import { getInitials, supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  if (!user || !profile) return null;

  return (
    <div className="pb-12">
      {/* Profile Hero */}
      <div className="relative pt-6 px-5 mb-6">
        <div className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-deep)] opacity-10 rounded-b-[40px]" />
        
        <div className="relative flex flex-col items-center pt-8">
          <div className="w-[100px] h-[100px] rounded-[30px] bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-dark)] p-[3px] shadow-2xl mb-4 relative">
            <div className="w-full h-full bg-[var(--bg)] rounded-[27px] overflow-hidden flex items-center justify-center p-1">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full rounded-[24px] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[24px] bg-[var(--surface2)] flex items-center justify-center font-bold text-3xl text-[var(--saffron)] font-serif">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--teal)] rounded-[10px] border-[3px] border-[var(--bg)] flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
              ✓
            </div>
          </div>
          
          <h2 className="text-[24px] font-bold text-[var(--text)] font-serif mb-1">{profile.name}</h2>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text3)] font-medium uppercase tracking-[0.06em]">
            <span>{profile.profession || 'Global Citizen'}</span>
            <span className="opacity-30">•</span>
            <span>{profile.native_city || 'Gujarat'} native</span>
          </div>

          <div className="mt-5 flex gap-2">
            <button className="h-[42px] px-8 rounded-full bg-[var(--saffron)] text-white text-[13px] font-bold shadow-lg shadow-[rgba(232,137,42,0.25)] hover:bg-[var(--saffron-dark)] transition-all">
              EDIT PROFILE
            </button>
            <button 
              onClick={() => { signOut(); router.push('/'); }}
              className="w-[42px] h-[42px] rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[18px] text-[var(--text3)] hover:text-white transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="flex gap-2.5 px-5 mb-8">
        <div className="stat-card">
          <div className="stat-num">1.2k</div>
          <div className="stat-label">Network</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-num">18</div>
          <div className="stat-label">Contributions</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">4.9</div>
          <div className="stat-label">Rating</div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="sec-title px-5">Professional Info</div>
      <div className="px-5 space-y-3 mb-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] p-4 flex gap-4">
          <div className="w-10 h-10 rounded-[12px] bg-[rgba(232,137,42,0.1)] flex items-center justify-center text-xl shrink-0">🎓</div>
          <div>
            <div className="text-[13px] font-bold text-[var(--text)] mb-0.5">Education</div>
            <div className="text-[12px] text-[var(--text2)]">MBA, Indian Institute of Management</div>
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] p-4 flex gap-4">
          <div className="w-10 h-10 rounded-[12px] bg-[rgba(26,174,163,0.1)] flex items-center justify-center text-xl shrink-0">💼</div>
          <div>
            <div className="text-[13px] font-bold text-[var(--text)] mb-0.5">Work History</div>
            <div className="text-[12px] text-[var(--text2)]">Senior Partner at Diamond Intl Group</div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="sec-title px-5">Key Skills</div>
      <div className="flex flex-wrap gap-2 px-5 mb-30">
        {['Strategic Growth', 'International Trade', 'Public Speaking', 'Mentoring', 'Investment Analysis'].map(skill => (
          <span key={skill} className="skill-tag">{skill}</span>
        ))}
      </div>
    </div>
  );
}
