'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { id: '/nearby', icon: '🔭', label: 'Discover' },
    { id: '/feed', icon: '🌐', label: 'Community' },
    { id: '/events', icon: '🎉', label: 'Events' },
    { id: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-[var(--tab-h)] bg-gradient-to-b from-[rgba(14,15,18,0.92)] to-[rgba(10,10,12,0.98)] backdrop-blur-[20px] border-t border-[var(--border)] flex px-2 pb-3 z-[90]">
      {tabs.map((tab) => {
        const active = pathname === tab.id || (tab.id !== '/' && pathname.startsWith(tab.id));
        
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-250 relative ${
              active ? 'text-[var(--saffron)]' : 'text-[var(--text3)]'
            }`}
          >
            {active && (
              <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-5 h-[2px] bg-[var(--saffron)] rounded-b-[2px]" />
            )}
            <span className={`text-xl transition-transform duration-250 ${active ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-medium tracking-[0.03em] uppercase">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
