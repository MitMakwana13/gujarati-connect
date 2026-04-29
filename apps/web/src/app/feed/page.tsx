'use client';

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const MotionA = dynamic(() => import('framer-motion').then(mod => mod.motion.a), { ssr: false });
const MotionButton = dynamic(() => import('framer-motion').then(mod => mod.motion.button), { ssr: false });
const MotionArticle = dynamic(() => import('framer-motion').then(mod => mod.motion.article), { ssr: false });
const MotionSpan = dynamic(() => import('framer-motion').then(mod => mod.motion.span), { ssr: false });
import { useAuth } from '@/lib/auth-context';
import { usePosts, useToggleLike, useCreatePost } from '@/hooks/usePosts';
import { useEvents } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { api } from '@/lib/api';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, buttonTap, scalePop, reduced } from '@/lib/motion';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const SIDEBAR_LINKS = [
  { href: '/feed',      icon: '🏠', label: 'Home Feed' },
  { href: '/discover',  icon: '🔍', label: 'Discover' },
  { href: '/groups',    icon: '👥', label: 'My Groups' },
  { href: '/events',    icon: '🎉', label: 'Events' },
  { href: '/resources', icon: '📋', label: 'Resources' },
  { href: '/messages',  icon: '💬', label: 'Messages' },
  { href: '/profile',   icon: '👤', label: 'Profile' },
];

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isReduced = useReducedMotion();
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const toggleLikeMutation = useToggleLike();
  const createPostMutation = useCreatePost();

  // Sidebar: real data with limit
  const { data: sidebarEvents = [] } = useEvents({ limit: '2' });
  const { data: sidebarGroups = [] } = useGroups({ limit: '3' });

  const queryClient = useQueryClient();

  const [composeText, setComposeText] = useState('');
  const [composeFocused, setComposeFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [composeMediaUrls, setComposeMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Comment state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Share state
  const [shareState, setShareState] = useState<Record<string, string>>({});

  // Sidebar action state
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [joiningGroups, setJoiningGroups] = useState<Record<string, boolean>>({});
  const [rsvpdEvents, setRsvpdEvents] = useState<Record<string, boolean>>({});
  const [rsvpingEvents, setRsvpingEvents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)' }}>
      <MotionDiv animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ fontSize: 28 }}>⏳</MotionDiv>
    </div>
  );

  function toggleLike(id: string, isCurrentlyLiked: boolean) {
    toggleLikeMutation.mutate({ id, isCurrentlyLiked });
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!composeText.trim() && composeMediaUrls.length === 0) return;
    createPostMutation.mutate(
      { body: composeText, contentType: composeMediaUrls.length > 0 ? 'media' : 'text', mediaUrls: composeMediaUrls },
      { onSuccess: () => { setComposeText(''); setComposeFocused(false); setComposeMediaUrls([]); } }
    );
  }

  // Photo upload handler
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setComposeFocused(true);
    try {
      const json = await api.uploadMedia(file);
      const urls: string[] = json.data?.urls ?? [];
      if (urls.length > 0) setComposeMediaUrls(prev => [...prev, ...urls]);
    } catch (err: any) {
      alert(err?.message ?? 'Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Comment handlers
  const toggleComments = useCallback(async (postId: string) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));
    if (!isExpanded && !postComments[postId]) {
      setCommentLoading(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await api.getPostComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: res.data ?? [] }));
      } catch { /* empty */ }
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [expandedComments, postComments]);

  async function submitComment(postId: string) {
    const body = commentInputs[postId]?.trim();
    if (!body) return;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      await api.createComment(postId, body);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // Refetch comments from backend truth
      const res = await api.getPostComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: res.data ?? [] }));
      // Refetch posts to update comment count
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch { /* empty */ }
    setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
  }

  // Share handler
  async function handleShare(postId: string) {
    const url = `${window.location.origin}/feed#post-${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Gujarati Global', url });
        setShareState(prev => ({ ...prev, [postId]: 'Shared!' }));
      } else {
        await navigator.clipboard.writeText(url);
        setShareState(prev => ({ ...prev, [postId]: 'Copied!' }));
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareState(prev => ({ ...prev, [postId]: 'Copied!' }));
      } catch {
        setShareState(prev => ({ ...prev, [postId]: 'Failed' }));
      }
    }
    setTimeout(() => setShareState(prev => ({ ...prev, [postId]: '' })), 2000);
  }

  // Sidebar join handler
  async function handleSidebarJoin(groupId: string) {
    setJoiningGroups(prev => ({ ...prev, [groupId]: true }));
    try {
      await api.joinGroup(groupId);
      setJoinedGroups(prev => ({ ...prev, [groupId]: true }));
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
    } catch { /* empty */ }
    setJoiningGroups(prev => ({ ...prev, [groupId]: false }));
  }

  // Sidebar RSVP handler
  async function handleSidebarRsvp(eventId: string) {
    setRsvpingEvents(prev => ({ ...prev, [eventId]: true }));
    try {
      await api.rsvpEvent(eventId, 'going');
      setRsvpdEvents(prev => ({ ...prev, [eventId]: true }));
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch { /* empty */ }
    setRsvpingEvents(prev => ({ ...prev, [eventId]: false }));
  }

  const staggerVariants = isReduced ? reduced.stagger : stagger.normal;
  const itemVariants = isReduced ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div className="app-layout">
        {/* Left sidebar */}
        <aside className="sidebar">
          {SIDEBAR_LINKS.map(item => (
            <MotionA
              key={item.href}
              href={item.href}
              className={`sidebar-item${item.href === '/feed' ? ' active' : ''}`}
              whileHover={isReduced ? undefined : { x: 4 }}
              transition={{ duration: 0.15 }}
            >
              {item.href === '/feed' && (
                <MotionDiv
                  layoutId="sidebar-pill"
                  style={{ position: 'absolute', inset: 0, background: 'var(--bg-glass-hover)', borderRadius: 'var(--r-md)', zIndex: -1 }}
                />
              )}
              <span className="icon">{item.icon}</span>
              {item.label}
            </MotionA>
          ))}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ padding: '8px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Signed in as<br />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.displayName}</span>
          </div>
        </aside>

        {/* Feed column */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Compose */}
          <MotionDiv className="card" style={{ padding: 20 }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible">
            <form onSubmit={e => { void handlePost(e); }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, color: 'var(--text-inverse)' }}>
                  {user.avatarInitials}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    id="compose-input"
                    ref={textareaRef}
                    className="input"
                    placeholder="Share something with the community..."
                    value={composeText}
                    onChange={e => setComposeText(e.target.value)}
                    onFocus={() => setComposeFocused(true)}
                    rows={composeFocused || composeText ? 3 : 1}
                    style={{ resize: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {(composeFocused || composeText || composeMediaUrls.length > 0) && (
                  <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    {composeMediaUrls.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        {composeMediaUrls.map((url, i) => (
                          <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img src={url} alt="Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setComposeMediaUrls(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'grid', placeItems: 'center' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploading && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>⏳ Uploading photo…</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>📷 Add Photo</button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <MotionButton type="button" className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => { setComposeFocused(false); setComposeText(''); setComposeMediaUrls([]); }}>Cancel</MotionButton>
                        <MotionButton id="post-submit" type="submit" className="btn btn-primary btn-sm" whileTap={buttonTap} disabled={(!composeText.trim() && composeMediaUrls.length === 0) || createPostMutation.isPending || uploading}>
                          {createPostMutation.isPending ? 'Posting…' : 'Post'}
                        </MotionButton>
                      </div>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={e => { void handlePhotoSelect(e); }} />

              {!composeFocused && !composeText && composeMediaUrls.length === 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button type="button" id="compose-photo" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>📷 Photo</button>
                  <button type="button" id="compose-event" className="btn btn-ghost btn-sm" onClick={() => router.push('/events/create')}>🎉 Event</button>
                  <button type="button" id="compose-resource" className="btn btn-ghost btn-sm" onClick={() => router.push('/resources/create')}>📋 Resource</button>
                </div>
              )}
            </form>
          </MotionDiv>

          {/* Posts */}
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <EmptyState icon="✨" title="Your feed is empty" description="Follow some communities and connect with people to see their posts here." action={{ label: 'Discover people', onClick: () => router.push('/discover') }} />
          ) : (
            <MotionDiv className="feed" variants={staggerVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {(posts as any[]).map((post: any) => (
                  <MotionArticle
                    key={post.id}
                    id={`post-${post.id}`}
                    className="card post-card"
                    variants={itemVariants}
                    layout
                    whileHover={isReduced ? undefined : { y: -2 }}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                    style={{ cursor: 'default' }}
                  >
                    <header style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>
                        {post.author.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{post.author.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', gap: 6 }}>
                          {post.author.city && <span>📍 {post.author.city}</span>}
                          {post.group && <><span>·</span><span>in <span style={{ color: 'var(--brand-indigo)' }}>{post.group}</span></span></>}
                          <span>{post.author.city || post.group ? '· ' : ''}{post.time}</span>
                        </div>
                      </div>
                    </header>

                    <p className="post-body">{post.body}</p>

                    {post.mediaUrls?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {post.mediaUrls.map((url: string, i: number) => (
                          <img key={i} src={url} alt="Post media" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, objectFit: 'cover' }} />
                        ))}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {post.tags.map((tag: string) => <span key={tag} className="badge badge-indigo" style={{ fontSize: 11 }}>{tag}</span>)}
                      </div>
                    )}

                    <div className="divider" style={{ marginBottom: 10 }} />
                    <div className="post-actions">
                      <MotionButton
                        id={`like-${post.id}`}
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleLike(post.id, post.liked)}
                        whileTap={buttonTap}
                        style={{ color: post.liked ? 'var(--brand-saffron)' : 'var(--text-secondary)' }}
                      >
                        <AnimatePresence mode="wait">
                          <MotionSpan key={post.liked ? 'liked' : 'notliked'} variants={scalePop} initial="hidden" animate="visible">
                            👍
                          </MotionSpan>
                        </AnimatePresence>
                        {post.liked ? 'Liked' : 'Like'}
                        <span style={{ color: 'var(--text-muted)' }}>{post.likes}</span>
                      </MotionButton>
                      <MotionButton id={`comment-${post.id}`} className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => { void toggleComments(post.id); }}>
                        💬 Comment <span style={{ color: 'var(--text-muted)' }}>{post.comments}</span>
                      </MotionButton>
                      <MotionButton id={`share-${post.id}`} className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => { void handleShare(post.id); }}>
                        {shareState[post.id] ? `✓ ${shareState[post.id]}` : '↗ Share'}
                      </MotionButton>
                    </div>

                    {/* Inline Comment Panel */}
                    {expandedComments[post.id] && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        {commentLoading[post.id] ? (
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>Loading comments…</div>
                        ) : (
                          <>
                            {(postComments[post.id] ?? []).length === 0 && (
                              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0 8px' }}>No comments yet. Be the first!</div>
                            )}
                            {(postComments[post.id] ?? []).map((c: any) => (
                              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>
                                  {(c.author_display_name ?? 'U').charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13 }}><strong>{c.author_display_name ?? 'User'}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(c.created_at).toLocaleDateString()}</span></div>
                                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{c.body}</div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input
                            className="input"
                            style={{ flex: 1, fontSize: 13 }}
                            placeholder="Write a comment…"
                            value={commentInputs[post.id] ?? ''}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitComment(post.id); } }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => { void submitComment(post.id); }} disabled={!commentInputs[post.id]?.trim() || commentSubmitting[post.id]}>
                            {commentSubmitting[post.id] ? '…' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}
                  </MotionArticle>
                ))}
              </AnimatePresence>
            </MotionDiv>
          )}
        </main>

        {/* Right rail */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Groups from API */}
          <MotionDiv className="card" style={{ padding: 20 }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: 15 }}>Suggested Groups</h3>
              <a href="/groups" className="section-link">See all</a>
            </div>
            {sidebarGroups.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No groups yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(sidebarGroups as any[]).map((g: any) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>👥</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.member_count?.toLocaleString()} members</div>
                    </div>
                    {joinedGroups[g.id] || g.myMembership?.status === 'active' ? (
                      <span className="btn btn-sm btn-ghost" style={{ fontSize: 12, padding: '4px 11px', color: 'var(--brand-teal)' }}>✓ Joined</span>
                    ) : (
                      <button className="btn btn-sm btn-secondary" style={{ fontSize: 12, padding: '4px 11px' }} onClick={() => { void handleSidebarJoin(g.id); }} disabled={joiningGroups[g.id]}>
                        {joiningGroups[g.id] ? '…' : 'Join'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </MotionDiv>

          {/* Events from API */}
          <MotionDiv className="card" style={{ padding: 20 }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: 15 }}>Upcoming Events</h3>
              <a href="/events" className="section-link">See all</a>
            </div>
            {sidebarEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No upcoming events.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sidebarEvents.map((evt: any) => (
                  <div key={evt.id} style={{ borderLeft: '3px solid var(--brand-saffron)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{evt.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      📅 {new Date(evt.starts_at).toLocaleDateString()}
                    </div>
                    {rsvpdEvents[evt.id] || evt.my_rsvp === 'going' ? (
                      <span className="btn btn-ghost btn-sm" style={{ marginTop: 8, display: 'inline-flex', fontSize: 12, color: 'var(--brand-teal)' }}>✓ Going</span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, display: 'inline-flex', fontSize: 12 }} onClick={() => { void handleSidebarRsvp(evt.id); }} disabled={rsvpingEvents[evt.id]}>
                        {rsvpingEvents[evt.id] ? '…' : 'RSVP →'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </MotionDiv>

          {/* Discover prompt */}
          <MotionDiv className="card" style={{ padding: 20, background: 'linear-gradient(135deg, hsla(247,75%,64%,0.12), hsla(32,98%,55%,0.08))' }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.35 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Find your people</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Connect with Gujaratis by shared roots, city, and industry.</p>
            <a href="/discover" className="btn btn-indigo btn-sm" style={{ width: '100%' }}>Explore Discover</a>
          </MotionDiv>
        </aside>
      </div>
    </div>
  );
}
