'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { api } from '@/lib/api';
import { fadeUp, buttonTap } from '@/lib/motion';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Conversation {
  id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  body: string | null;
  media_urls: string[];
  message_type: string;
  is_edited: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convoLoading, setConvoLoading] = useState(true);
  const [convoError, setConvoError] = useState(false);

  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    setConvoLoading(true);
    setConvoError(false);
    api.getConversations()
      .then((res: any) => setConversations(res.data ?? []))
      .catch(() => setConvoError(true))
      .finally(() => setConvoLoading(false));
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    setMsgLoading(true);
    api.getConversationMessages(activeConvo)
      .then((res: any) => {
        setMessages(res.data ?? []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => { /* empty */ })
      .finally(() => setMsgLoading(false));
  }, [activeConvo]);

  async function handleSend() {
    if (!messageInput.trim() || !activeConvo) return;
    setSending(true);
    try {
      await api.sendMessage(activeConvo, messageInput.trim());
      setMessageInput('');
      // Refetch messages from backend truth
      const res = await api.getConversationMessages(activeConvo);
      setMessages(res.data ?? []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      // Also refresh conversation list for preview
      const convoRes = await api.getConversations();
      setConversations(convoRes.data ?? []);
    } catch { /* empty */ }
    setSending(false);
  }

  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  const activeConversation = conversations.find(c => c.id === activeConvo);
  const v = rm ? undefined : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={v} initial="hidden" animate="visible" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>Messages</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Your conversations with community members</p>
        </motion.div>

        {convoLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : convoError ? (
          <EmptyState icon="⚠️" title="Could not load conversations" description="Please try again in a moment." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            description="Discover people and connect to start messaging."
            action={{ label: 'Discover People', onClick: () => router.push('/discover') }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, minHeight: 500 }}>
            {/* Conversation List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Conversations ({conversations.length})
              </div>
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {conversations.map(c => (
                  <button
                    key={c.id}
                    id={`convo-${c.id}`}
                    onClick={() => setActiveConvo(c.id)}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', width: '100%',
                      border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                      background: activeConvo === c.id ? 'var(--bg-glass-hover)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, color: 'var(--text-inverse)', flexShrink: 0 }}>
                      {(c.other_user_name ?? 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.other_user_name ?? 'User'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.last_message_preview ?? 'No messages yet'}
                      </div>
                    </div>
                    {c.last_message_at && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {new Date(c.last_message_at).toLocaleDateString()}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!activeConvo ? (
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Select a conversation</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choose a conversation from the left to view messages</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-inverse)' }}>
                      {(activeConversation?.other_user_name ?? 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{activeConversation?.other_user_name ?? 'User'}</div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380 }}>
                    {msgLoading ? (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Loading messages…</div>
                    ) : messages.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No messages yet. Say hello!</div>
                    ) : (
                      messages.map(msg => {
                        const isMe = msg.sender_id === (user as any).id;
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '70%', padding: '10px 14px', borderRadius: 14,
                              background: isMe ? 'var(--brand-indigo)' : 'var(--bg-elevated)',
                              color: isMe ? 'white' : 'var(--text-primary)',
                              fontSize: 13, lineHeight: 1.5,
                            }}>
                              {!isMe && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3, opacity: 0.8 }}>{msg.sender_name}</div>}
                              <div>{msg.body}</div>
                              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <input
                      id="message-input"
                      className="input"
                      style={{ flex: 1, fontSize: 13 }}
                      placeholder="Type a message…"
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                    />
                    <motion.button
                      id="send-message"
                      className="btn btn-primary btn-sm"
                      whileTap={buttonTap}
                      onClick={() => { void handleSend(); }}
                      disabled={!messageInput.trim() || sending}
                    >
                      {sending ? '…' : 'Send'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
