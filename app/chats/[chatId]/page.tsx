'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Message, Profile, getInitials } from '@/lib/supabase';
import { ChatService } from '@/lib/services/chat.service';
import { ProfileService } from '@/lib/services/profile.service';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatThread() {
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !chatId) return;
    ChatService.getOtherParticipant(chatId, user.id).then(otherId => {
      if (otherId) ProfileService.getProfileById(otherId).then(p => setOtherUser(p));
    });

    ChatService.getMessages(chatId).then(setMessages);

    const channel = ChatService.subscribeToMessages(chatId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => ChatService.unsubscribe(channel);
  }, [user, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user || !chatId) return;
    setSending(true);
    setText('');
    try {
      await ChatService.sendMessage(chatId, body);
    } catch {
      toast.error('Failed to send');
      setText(body);
    }
    setSending(false);
  };

  const name = otherUser?.name || 'Gujarati Member';

  return (
    <main className="flex flex-col h-[100dvh] bg-[#0A0E19] text-white">

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 backdrop-blur-xl bg-[#0A0E19]/85 sticky top-0 z-40 shrink-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-white/70 hover:bg-white/[0.05] hover:text-white transition active:scale-95">
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0">
          {otherUser?.photo_url ? (
            <img src={otherUser.photo_url} alt="" className="w-10 h-10 rounded-[14px] object-cover ring-1 ring-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-[14px] bg-white/[0.04] ring-1 ring-white/10 flex items-center justify-center font-bold text-slate-400">
              {getInitials(name)}
            </div>
          )}
          {otherUser?.is_online && (
             <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0A0E19] bg-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] tracking-tight truncate">{name}</h1>
          {otherUser?.is_online ? (
            <p className="text-[12px] font-medium text-emerald-400 tracking-wide">Active now</p>
          ) : (
            <p className="text-[12px] text-slate-400 tracking-wide">Offline</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto scroll-smooth">
        {messages.map((m, i) => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : ''}`}>
              <div className={`
                px-4 py-3 rounded-3xl max-w-[75%] md:max-w-[65%] text-[15px] leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.15)]
                 ${isMe 
                  ? 'bg-amber-400 text-black rounded-tr-sm font-medium' 
                  : 'bg-white/[0.05] border border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-md'}
              `}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-[#0A0E19]/90 backdrop-blur-2xl flex gap-3 pb-6 sm:pb-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] focus:border-amber-400/40 text-white placeholder:text-slate-500 px-5 py-3.5 rounded-[20px] outline-none transition-colors text-[15px]"
          placeholder="Type a message..."
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="bg-amber-400 px-5 rounded-[20px] text-black font-semibold shadow-[0_4px_20px_rgba(245,158,11,0.25)] transition hover:bg-amber-300 active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:shadow-none"
        >
          <Send size={18} className={text.trim() && !sending ? 'ml-[2px] mt-[1px]' : ''} />
        </button>
      </div>

    </main>
  );
}
