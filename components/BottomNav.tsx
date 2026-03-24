'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageCircle, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const unreadChats = useAppStore(s => s.unreadChats);

  const tabs = [
    { id: '/nearby', icon: Home, label: 'Nearby' },
    { id: '/chats', icon: MessageCircle, label: 'Chats', badge: unreadChats },
    { id: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#0a0e19]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-50 flex items-center justify-between">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.id);
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.id)}
            className="group relative flex-1 flex flex-col items-center justify-center py-2 h-14 rounded-3xl transition-all duration-300 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {active && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute inset-0 bg-[#f59e0b] rounded-[24px]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <Icon 
                size={22} 
                className={`transition-colors duration-300 ${active ? 'text-black' : 'text-[#94a3b8] group-hover:text-white'}`} 
                strokeWidth={active ? 2.5 : 2} 
              />
              {tab.badge && tab.badge > 0 && (
                <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${active ? 'bg-black text-[#f59e0b] border-[#f59e0b]' : 'bg-[#f59e0b] text-black border-[#0a0e19]'}`}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
