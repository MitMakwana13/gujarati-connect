'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap, messageBubble, reduced, stagger } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageRowSkeleton, MessageBubbleSkeleton } from '@/components/ui/Skeleton';

type Conversation = {
  id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  status: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  other_user_id: string;
};

type Message = {
  id: string;
  sender_id: string;
  body: string | null;
  media_urls: string[] | null;
  message_type: string;
  created_at: string;
  sender_name: string | null;
  sender_avatar: string | null;
};

function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'GG';
}

function timeLabel(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);

  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.getConversations();
      return (data ?? []) as Conversation[];
    },
  });

  useEffect(() => {
    if (!selectedId && conversations.length > 0) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const selectedConversation = useMemo(() => conversations.find(c => c.id === selectedId) ?? null, [conversations, selectedId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data } = await api.getConversationMessages(selectedId!);
      return (data ?? []) as Message[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) => api.sendMessage(conversationId, body),
    onSuccess: async () => {
      setDraft('');
      await queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedId] });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  if (isLoading || !user) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    sendMutation.mutate({ conversationId: selectedId, body: draft.trim() });
  }

  const itemV = rm ? reduced.fadeUp : fadeUp;
  const staggerV = rm ? reduced.stagger : stagger.fast;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>Messages</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Private community conversations and accepted message requests.</p>
        </motion.div>

        {conversationsError ? (
          <EmptyState icon="⚠️" title="Could not load messages" description="Please try again in a moment." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : conversationsLoading ? (
          <div className="card" style={{ padding: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <MessageRowSkeleton key={i} />)}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            description="Discover community members and start connecting when message requests are available."
            action={{ label: 'Discover People', onClick: () => router.push('/discover') }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'stretch' }}>
            <motion.aside className="card" style={{ padding: 12, minHeight: 560 }} variants={staggerV} initial="hidden" animate="visible">
              {conversations.map((conversation) => {
                const name = conversation.other_user_name ?? 'Community Member';
                const active = conversation.id === selectedId;
                return (
                  <motion.button
                    key={conversation.id}
                    id={`conversation-${conversation.id}`}
                    variants={itemV}
                    className="btn btn-ghost"
                    onClick={() => setSelectedId(conversation.id)}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 12,
                      padding: 12,
                      marginBottom: 6,
                      background: active ? 'var(--bg-glass-hover)' : undefined,
                    }}
                  >
                    {conversation.other_user_avatar ? (
                      <img src={conversation.other_user_avatar} alt={name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', color: 'var(--text-inverse)', fontWeight: 800 }}>
                        {initials(name)}
                      </span>
                    )}
                    <span style={{ minWidth: 0, textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conversation.last_message_preview ?? 'No messages yet'}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.aside>

            <section className="card" style={{ padding: 0, minHeight: 560, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{selectedConversation?.other_user_name ?? 'Conversation'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last active {timeLabel(selectedConversation?.last_message_at)}</div>
                </div>
              </div>

              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messagesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <MessageBubbleSkeleton align="left" />
                    <MessageBubbleSkeleton align="right" />
                    <MessageBubbleSkeleton align="left" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 42, marginBottom: 8 }}>👋</div>
                    <div>No messages in this conversation yet.</div>
                  </div>
                ) : (
                  messages.map((message, idx) => {
                    const mine = message.sender_id === user.id;
                    return (
                      <motion.div
                        key={message.id}
                        id={`message-${message.id}`}
                        variants={messageBubble}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: idx * 0.03 }}
                        style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}
                      >
                        <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 16, background: mine ? 'var(--brand-indigo)' : 'var(--bg-elevated)', color: mine ? 'var(--text-inverse)' : 'var(--text-primary)' }}>
                          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{message.body}</div>
                          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{timeLabel(message.created_at)}</div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <input
                  id="message-input"
                  className="input"
                  placeholder="Write a message…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  disabled={!selectedId || sendMutation.isPending}
                />
                <motion.button
                  id="send-message"
                  type="submit"
                  className="btn btn-primary"
                  whileTap={buttonTap}
                  disabled={!draft.trim() || !selectedId || sendMutation.isPending}
                  style={{ minWidth: 80 }}
                >
                  {sendMutation.isPending ? <><span className="spinner spinner-sm" /> Sending</> : 'Send'}
                </motion.button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
