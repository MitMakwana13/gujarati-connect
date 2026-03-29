'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { messageBubble, buttonTap, fadeUp } from '@/lib/motion';
import { MessageRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Message {
  id: string;
  text: string;
  sentByMe: boolean;
  time: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  initials: string;
  online: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

const INITIAL_CONVS: Conversation[] = [
  {
    id: '1', name: 'Dhruv Desai', initials: 'DD', online: true,
    lastMessage: 'Let me know when you are free to chat!', lastTime: '2m', unread: 2,
    messages: [
      { id: 'm1', text: 'Hey! I saw we are both in the GJ Startup Network group.', sentByMe: false, time: '2:14 PM', read: true },
      { id: 'm2', text: 'Yes! Great community. Are you coming to the NYC event next month?', sentByMe: true, time: '2:16 PM', read: true },
      { id: 'm3', text: 'Definitely planning to! Let me know when you are free to chat!', sentByMe: false, time: '2:18 PM', read: false },
    ],
  },
  {
    id: '2', name: 'Riya Shah', initials: 'RS', online: true,
    lastMessage: 'Thanks for the referral!', lastTime: '1h', unread: 0,
    messages: [
      { id: 'm1', text: 'Hi! I came across your profile on Gujarati Global.', sentByMe: true, time: '10:00 AM', read: true },
      { id: 'm2', text: 'Hello! Nice to connect — I love this platform.', sentByMe: false, time: '10:05 AM', read: true },
      { id: 'm3', text: 'I applied to the Barclays role you shared. Thanks for the referral!', sentByMe: false, time: '10:30 AM', read: true },
    ],
  },
  {
    id: '3', name: 'Karan Mehta', initials: 'KM', online: false,
    lastMessage: 'See you at cricket this weekend!', lastTime: '3h', unread: 1,
    messages: [
      { id: 'm1', text: 'Are you joining cricket practice this Saturday?', sentByMe: false, time: 'Yesterday', read: true },
      { id: 'm2', text: 'Yes! 10am at the usual ground right?', sentByMe: true, time: 'Yesterday', read: true },
      { id: 'm3', text: 'Exactly! See you at cricket this weekend!', sentByMe: false, time: 'Yesterday', read: false },
    ],
  },
  {
    id: '4', name: 'Minal Joshi', initials: 'MJ', online: false,
    lastMessage: 'The Navratri decorations look amazing!', lastTime: '2d', unread: 0,
    messages: [
      { id: 'm1', text: 'Hi Minal! Excited for the event next week.', sentByMe: true, time: '2d ago', read: true },
      { id: 'm2', text: 'The Navratri decorations look amazing! Cannot wait.', sentByMe: false, time: '2d ago', read: true },
    ],
  },
];

function formatDateSeparator(messages: Message[], index: number): string | null {
  if (index === 0) return 'Today';
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev && curr && prev.time.includes('Yesterday') && !curr.time.includes('Yesterday')) return 'Today';
  return null;
}

export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [convs, setConvs] = useState(INITIAL_CONVS);
  const [activeId, setActiveId] = useState<string>('1');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);

  useEffect(() => { const t = setTimeout(() => setLoadingConvs(false), 700); return () => clearTimeout(t); }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
  }, [activeId, convs, rm]);

  // Mark messages as read when switching conversation
  useEffect(() => {
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0, messages: c.messages.map(m => ({ ...m, read: true })) } : c));
  }, [activeId]);

  const activeConv = convs.find(c => c.id === activeId);
  const totalUnread = convs.reduce((acc, c) => acc + c.unread, 0);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);

    // Optimistic update
    const newMsg: Message = { id: Date.now().toString(), text, sentByMe: true, time: 'Just now', read: false };
    setConvs(prev => prev.map(c => c.id === activeId
      ? { ...c, lastMessage: text, lastTime: 'now', messages: [...c.messages, newMsg] }
      : c
    ));

    setSending(false);

    // Simulate reply after delay
    if (activeId === '1') {
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        setIsTyping(false);
        const reply: Message = { id: (Date.now() + 1).toString(), text: 'That sounds great! Looking forward to it. 🙏', sentByMe: false, time: 'Just now', read: true };
        setConvs(prev => prev.map(c => c.id === '1' ? { ...c, lastMessage: reply.text, messages: [...c.messages, reply] } : c));
      }, 2200);
    }
  }

  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  return (
    <div>
      <AppNav />
      <div className="messages-layout">
        {/* Left: Conversation list */}
        <div className="messages-sidebar">
          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Messages {totalUnread > 0 && <span className="unread-count" style={{ marginLeft: 8 }}>{totalUnread}</span>}</h2>
              <button id="new-message-btn" className="btn btn-primary btn-xs">+ New</button>
            </div>
            <input type="search" className="input" placeholder="🔍 Search conversations…" style={{ fontSize: 13, padding: '8px 12px' }} />
          </div>

          {/* Conversation rows */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loadingConvs ? (
              Array.from({ length: 4 }).map((_, i) => <MessageRowSkeleton key={i} />)
            ) : convs.length === 0 ? (
              <EmptyState icon="💬" title="No messages yet" description="Connect with people on Discover to start chatting." />
            ) : convs.map(conv => (
              <motion.div
                key={conv.id}
                id={`conv-row-${conv.id}`}
                className={`conv-row${conv.id === activeId ? ' active' : ''}`}
                onClick={() => setActiveId(conv.id)}
                whileHover={rm ? undefined : { backgroundColor: 'var(--bg-glass-hover)' }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-saffron))', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700, color: 'var(--text-inverse)' }}>
                    {conv.initials}
                  </div>
                  <div className={`presence-dot ${conv.online ? 'online' : 'offline'}`} style={{ position: 'absolute', bottom: 2, right: 2, border: '2px solid var(--bg-surface)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{conv.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{conv.lastTime}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                      {conv.lastMessage}
                    </span>
                    {conv.unread > 0 && <span className="unread-count">{conv.unread}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Active chat */}
        <div className="messages-main">
          {!activeConv ? (
            <EmptyState icon="💬" title="Select a conversation" description="Choose someone from the left to start chatting." />
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--bg-surface)' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-saffron))', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-inverse)' }}>
                    {activeConv.initials}
                  </div>
                  <div className={`presence-dot ${activeConv.online ? 'online' : 'offline'}`} style={{ position: 'absolute', bottom: 1, right: 1, border: '2px solid var(--bg-surface)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{activeConv.name}</div>
                  <div style={{ fontSize: 12, color: activeConv.online ? 'var(--brand-teal)' : 'var(--text-muted)' }}>
                    {isTyping && activeConv.id === '1' ? '✍️ typing…' : activeConv.online ? 'Online now' : 'Offline'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button id="view-profile-btn" className="btn btn-ghost btn-sm" onClick={() => router.push('/discover')}>👤 Profile</button>
                  <button id="block-btn" className="btn btn-ghost btn-sm">•••</button>
                </div>
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AnimatePresence initial={false}>
                  {activeConv.messages.map((msg, idx) => {
                    const dateSep = formatDateSeparator(activeConv.messages, idx);
                    return (
                      <div key={msg.id}>
                        {dateSep && (
                          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '12px 0 8px', fontWeight: 500 }}>
                            ─── {dateSep} ───
                          </div>
                        )}
                        <motion.div
                          id={`msg-${msg.id}`}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sentByMe ? 'flex-end' : 'flex-start' }}
                          variants={rm ? undefined : messageBubble}
                          initial="hidden"
                          animate="visible"
                        >
                          <div className={`message-bubble ${msg.sentByMe ? 'sent' : 'received'}`}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                            {msg.time}
                            {msg.sentByMe && <span style={{ color: msg.read ? 'var(--brand-teal)' : 'var(--text-muted)' }}>{msg.read ? '✓✓' : '✓'}</span>}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && activeConv.id === '1' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}
                    >
                      <div className="message-bubble received" style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)' }}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-surface)' }}>
                <form id="message-composer" onSubmit={e => { void handleSend(e); }} style={{ display: 'flex', gap: 10 }}>
                  <input
                    id="message-input"
                    className="input"
                    placeholder="Write a message…"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    autoComplete="off"
                    style={{ fontSize: 14 }}
                  />
                  <motion.button
                    id="send-message-btn"
                    type="submit"
                    className="btn btn-primary"
                    style={{ flexShrink: 0, padding: '10px 20px' }}
                    whileTap={buttonTap}
                    disabled={!draft.trim() || sending}
                  >
                    {sending ? '…' : '↑ Send'}
                  </motion.button>
                </form>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                  Messages are end-to-end encrypted
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
