'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageCircle, User, Globe } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const unreadChats = useAppStore(s => s.unreadChats);

  const tabs = [
    { id: '/nearby', icon: '🔭', label: 'Discover' },
    { id: '/feed', icon: '🌐', label: 'Community' },
    { id: '/events', icon: '🎉', label: 'Events' },
    { id: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-[var(--tab-h)] bg-[var(--surface)] border-t border-[var(--border)] flex pb-2 z-50">
      {tabs.map((tab) => {
        const active = pathname === tab.id || (tab.id !== '/' && pathname.startsWith(tab.id));
        
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200 ${
              active ? 'text-[var(--saffron)]' : 'text-[var(--text3)]'
            }`}
          >
            <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-medium tracking-wide">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
