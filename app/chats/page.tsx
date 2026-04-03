'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChatService } from '@/lib/services/chat.service';
import { EnrichedThread } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '@/components/BottomNav';
import { useAppStore } from '@/lib/store';

export default function ChatsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<EnrichedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadChats = useAppStore(s => s.unreadChats);

  useEffect(() => {
    if (!user) return;
    ChatService.getMyThreads().then(threads => {
      setThreads(threads);
      setLoading(false);
    });
  }, [user]);

  return (
    <main className="min-h-[100dvh] px-4 pt-6 pb-32 bg-[#0A0E19] text-white page">
      <section className="max-w-md mx-auto w-full page-content">

        {/* Header */}
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <h1 className="text-[28px] font-semibold tracking-tight font-['Poppins']">Conversations</h1>
            {unreadChats > 0 && (
              <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-sm">
                {unreadChats}
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Stay connected with your Gujarati network
          </p>
        </div>

        {/* Chat list */}
        <div className="mt-6 space-y-3">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-[24px] border border-white/10 bg-white/[0.04] animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06]" />
              <div className="flex-1 py-1">
                <div className="h-4 w-32 bg-white/[0.06] rounded mb-2" />
                <div className="h-3 w-48 bg-white/[0.06] rounded" />
              </div>
            </div>
          ))}

          {!loading && threads.length === 0 && (
             <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-amber-400/20 bg-amber-400/10 text-3xl mb-5">💭</div>
               <h3 className="text-xl font-semibold text-white font-['Poppins'] tracking-tight">No conversations yet</h3>
               <p className="text-slate-400 text-sm mt-2 mb-6">Connect with people nearby to start chatting.</p>
             </div>
          )}

          {!loading && threads.map((t, i) => {
            const isUnread = false; // Add real logic if unread counts are tracked per thread

            return (
              <motion.a
                key={t.id}
                href={`/chats/${t.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-[24px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition duration-300 active:scale-[0.98]"
              >
                <div className="relative">
                  {t.other_user.photo_url ? (
                     <img src={t.other_user.photo_url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                  ) : (
                     <div className="w-14 h-14 rounded-[18px] bg-[#0a0e19] border border-white/10 flex items-center justify-center font-bold text-slate-400 text-xl">
                       {t.other_user.name?.charAt(0) || 'G'}
                     </div>
                  )}
                  {t.other_user.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0A0E19]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-[15px] truncate font-['Poppins'] tracking-tight text-white">{t.other_user.name || 'Gujarati Member'}</h3>
                    {t.last_message_at && (
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(t.last_message_at))}
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-slate-400 truncate">
                    {t.last_message || 'Start typing a message...'}
                  </p>
                </div>

                {isUnread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] shrink-0" />
                )}
              </motion.a>
            );
          })}
        </div>

      </section>
      <BottomNav />
    </main>
  );
}
