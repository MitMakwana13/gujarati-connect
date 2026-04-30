'use client';

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { usePosts, useToggleLike, useCreatePost } from '@/hooks/usePosts';
import { useEvents, useRSVP } from '@/hooks/useEvents';
import { useGroups, useJoinGroup } from '@/hooks/useGroups';
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

type UiPost = {
  id: string;
  author: { name: string; avatar?: string | null; city?: string; initials?: string };
  body: string;
  mediaUrls?: string[];
  time: string;
  likes: number;
  liked: boolean;
  comments: number;
  tags: string[];
  group?: string;
};

type ApiComment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_display_name?: string | null;
  author_avatar_url?: string | null;
};

function Avatar({ name, avatar, size = 42 }: { name: string; avatar?: string | null; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'GG';

  if (avatar && avatar.startsWith('http')) {
    return <img src={avatar} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, color: 'var(--text-inverse)' }}>
      {initials}
    </div>
  );
}

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isReduced = useReducedMotion();

  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const toggleLikeMutation = useToggleLike();
  const createPostMutation = useCreatePost();

  const { data: sidebarEvents = [] } = useEvents({ limit: '2' });
  const { data: sidebarGroups = [] } = useGroups({ limit: '3' });
  const joinGroupMutation = useJoinGroup();
  const rsvpMutation = useRSVP();

  const [composeText, setComposeText] = useState('');
  const [composeFocused, setComposeFocused] = useState(false);
  const [composeMediaUrls, setComposeMediaUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());
  const [sideActionError, setSideActionError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ fontSize: 28 }}>⏳</motion.div>
    </div>
  );

  function toggleLike(id: string, isCurrentlyLiked: boolean) {
    toggleLikeMutation.mutate({ id, isCurrentlyLiked });
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadingPhoto(true);
    try {
      const result = await api.uploadMedia(file);
      const urls = result?.data?.urls ?? [];
      if (urls.length === 0) throw new Error('Upload returned no media URL');
      setComposeMediaUrls(prev => [...prev, ...urls]);
      setComposeFocused(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    const body = composeText.trim();
    if (!body && composeMediaUrls.length === 0) return;

    createPostMutation.mutate(
      {
        body: body || undefined,
        contentType: composeMediaUrls.length > 0 ? 'image' : 'text',
        mediaUrls: composeMediaUrls,
      },
      {
        onSuccess: () => {
          setComposeText('');
          setComposeFocused(false);
          setComposeMediaUrls([]);
          setUploadError(null);
        },
      },
    );
  }

  function toggleComments(postId: string) {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  async function sharePost(postId: string) {
    const url = `${window.location.origin}/feed#post-${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Gujarati Global post', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopiedPostId(postId);
      window.setTimeout(() => setCopiedPostId(current => current === postId ? null : current), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedPostId(postId);
        window.setTimeout(() => setCopiedPostId(current => current === postId ? null : current), 2000);
      } catch {
        setSideActionError('Could not copy share link.');
        window.setTimeout(() => setSideActionError(null), 2500);
      }
    }
  }

  function joinSidebarGroup(groupId: string) {
    setSideActionError(null);
    joinGroupMutation.mutate(
      { id: groupId },
      {
        onSuccess: async () => {
          setJoinedGroupIds(prev => new Set(prev).add(groupId));
          await queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
        onError: (err) => {
          setSideActionError(err instanceof Error ? err.message : 'Could not join group.');
          window.setTimeout(() => setSideActionError(null), 2500);
        },
      },
    );
  }

  function rsvpSidebarEvent(eventId: string) {
    setSideActionError(null);
    rsvpMutation.mutate(
      { id: eventId, status: 'going' },
      {
        onSuccess: async () => {
          setRsvpedEventIds(prev => new Set(prev).add(eventId));
          await queryClient.invalidateQueries({ queryKey: ['events'] });
        },
        onError: (err) => {
          setSideActionError(err instanceof Error ? err.message : 'Could not RSVP to event.');
          window.setTimeout(() => setSideActionError(null), 2500);
        },
      },
    );
  }

  const staggerVariants = isReduced ? reduced.stagger : stagger.normal;
  const itemVariants = isReduced ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div className="app-layout">
        <aside className="sidebar">
          {SIDEBAR_LINKS.map(item => (
            <motion.a
              key={item.href}
              href={item.href}
              className={`sidebar-item${item.href === '/feed' ? ' active' : ''}`}
              whileHover={isReduced ? undefined : { x: 4 }}
              transition={{ duration: 0.15 }}
            >
              {item.href === '/feed' && (
                <motion.div
                  layoutId="sidebar-pill"
                  style={{ position: 'absolute', inset: 0, background: 'var(--bg-glass-hover)', borderRadius: 'var(--r-md)', zIndex: -1 }}
                />
              )}
              <span className="icon">{item.icon}</span>
              {item.label}
            </motion.a>
          ))}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ padding: '8px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Signed in as<br />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.displayName}</span>
          </div>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <motion.div className="card" style={{ padding: 20 }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible">
            <form onSubmit={e => { void handlePost(e); }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { void handlePhotoChange(e); }} />

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar name={user.displayName} size={42} />
                <div style={{ flex: 1 }}>
                  <textarea
                    id="compose-input"
                    ref={textareaRef}
                    className="input"
                    placeholder="Share something with the community..."
                    value={composeText}
                    onChange={e => setComposeText(e.target.value)}
                    onFocus={() => setComposeFocused(true)}
                    rows={composeFocused || composeText || composeMediaUrls.length > 0 ? 3 : 1}
                    style={{ resize: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                  />

                  {composeMediaUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                      {composeMediaUrls.map((url) => (
                        <div key={url} style={{ position: 'relative' }}>
                          <img src={url} alt="Post upload" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: 'white' }}
                            onClick={() => setComposeMediaUrls(prev => prev.filter(item => item !== url))}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>⚠️ {uploadError}</div>}
                </div>
              </div>

              <AnimatePresence>
                {(composeFocused || composeText || composeMediaUrls.length > 0) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" id="compose-photo-inline" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                          {uploadingPhoto ? 'Uploading…' : '📷 Add Photo'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <motion.button type="button" className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => { setComposeFocused(false); setComposeText(''); setComposeMediaUrls([]); setUploadError(null); }}>Cancel</motion.button>
                        <motion.button id="post-submit" type="submit" className="btn btn-primary btn-sm" whileTap={buttonTap} disabled={(!composeText.trim() && composeMediaUrls.length === 0) || createPostMutation.isPending || uploadingPhoto}>
                          {createPostMutation.isPending ? 'Posting…' : 'Post'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!composeFocused && !composeText && composeMediaUrls.length === 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button type="button" id="compose-photo" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                    {uploadingPhoto ? 'Uploading…' : '📷 Photo'}
                  </button>
                  <button type="button" id="compose-event" className="btn btn-ghost btn-sm" onClick={() => router.push('/events/create')}>🎉 Event</button>
                  <button type="button" id="compose-resource" className="btn btn-ghost btn-sm" onClick={() => router.push('/resources/create')}>📋 Resource</button>
                </div>
              )}
            </form>
          </motion.div>

          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <EmptyState icon="✨" title="Your feed is empty" description="Follow some communities and connect with people to see their posts here." action={{ label: 'Discover people', onClick: () => router.push('/discover') }} />
          ) : (
            <motion.div className="feed" variants={staggerVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {(posts as UiPost[]).map((post) => (
                  <motion.article
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
                      <Avatar name={post.author.name} avatar={post.author.avatar} size={42} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{post.author.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', gap: 6 }}>
                          {post.author.city && <span>📍 {post.author.city}</span>}
                          {post.group && <><span>·</span><span>in <span style={{ color: 'var(--brand-indigo)' }}>{post.group}</span></span></>}
                          <span>{post.author.city || post.group ? '· ' : ''}{post.time}</span>
                        </div>
                      </div>
                    </header>

                    {post.body && <p className="post-body">{post.body}</p>}

                    {(post.mediaUrls?.length ?? 0) > 0 && (
                      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                        {post.mediaUrls!.map(url => (
                          <img key={url} src={url} alt="Post media" style={{ width: '100%', maxHeight: 460, objectFit: 'cover', borderRadius: 16, border: '1px solid var(--border)' }} />
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
                      <motion.button
                        id={`like-${post.id}`}
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleLike(post.id, post.liked)}
                        whileTap={buttonTap}
                        style={{ color: post.liked ? 'var(--brand-saffron)' : 'var(--text-secondary)' }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.span key={post.liked ? 'liked' : 'notliked'} variants={scalePop} initial="hidden" animate="visible">
                            👍
                          </motion.span>
                        </AnimatePresence>
                        {post.liked ? 'Liked' : 'Like'}
                        <span style={{ color: 'var(--text-muted)' }}>{post.likes}</span>
                      </motion.button>

                      <motion.button id={`comment-${post.id}`} className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => toggleComments(post.id)}>
                        💬 Comment <span style={{ color: 'var(--text-muted)' }}>{post.comments}</span>
                      </motion.button>

                      <motion.button id={`share-${post.id}`} className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => { void sharePost(post.id); }} style={{ color: copiedPostId === post.id ? 'hsl(150,60%,55%)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
                        {copiedPostId === post.id ? '✓' : '↗'} {copiedPostId === post.id ? 'Copied!' : 'Share'}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {expandedComments.has(post.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <InlineComments postId={post.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sideActionError && (
            <div className="error-banner" style={{ fontSize: 13 }}>
              ⚠️ {sideActionError}
            </div>
          )}

          <motion.div className="card" style={{ padding: 20 }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: 15 }}>Suggested Groups</h3>
              <a href="/groups" className="section-link">See all</a>
            </div>
            {sidebarGroups.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No groups yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(sidebarGroups as any[]).map((g: any) => {
                  const isJoined = joinedGroupIds.has(g.id) || g.myMembership?.status === 'active';
                  const isPending = g.myMembership?.status === 'pending';
                  return (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>👥</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.member_count?.toLocaleString()} members</div>
                      </div>
                      <button
                        id={`sidebar-join-${g.id}`}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: 12, padding: '4px 11px', color: isJoined ? 'hsl(150,60%,55%)' : undefined, borderColor: isJoined ? 'hsla(150,60%,55%,0.3)' : undefined, transition: 'all 0.2s' }}
                        disabled={isJoined || isPending || joinGroupMutation.isPending}
                        onClick={() => joinSidebarGroup(g.id)}
                      >
                        {isJoined ? '✓ Joined' : isPending ? 'Pending' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div className="card" style={{ padding: 20 }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: 15 }}>Upcoming Events</h3>
              <a href="/events" className="section-link">See all</a>
            </div>
            {sidebarEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No upcoming events.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sidebarEvents.map((evt: any) => {
                  const isGoing = rsvpedEventIds.has(evt.id) || evt.my_rsvp === 'going';
                  return (
                    <div key={evt.id} style={{ borderLeft: '3px solid var(--brand-saffron)', paddingLeft: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{evt.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        📅 {new Date(evt.starts_at).toLocaleDateString()}
                      </div>
                      <button
                        id={`sidebar-rsvp-${evt.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 8, display: 'inline-flex', fontSize: 12, color: isGoing ? 'hsl(150,60%,55%)' : undefined, borderColor: isGoing ? 'hsla(150,60%,55%,0.3)' : undefined, transition: 'all 0.2s' }}
                        disabled={isGoing || rsvpMutation.isPending}
                        onClick={() => rsvpSidebarEvent(evt.id)}
                      >
                        {isGoing ? '✓ Going' : 'RSVP →'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, hsla(247,75%,64%,0.12), hsla(32,98%,55%,0.08))' }} variants={isReduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.35 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Find your people</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Connect with Gujaratis by shared roots, city, and industry.</p>
            <a href="/discover" className="btn btn-indigo btn-sm" style={{ width: '100%' }}>Explore Discover</a>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

function InlineComments({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState('');

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data } = await api.getPostComments(postId);
      return (data ?? []) as ApiComment[];
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: ({ body }: { body: string }) => api.createComment(postId, body),
    onSuccess: async () => {
      setCommentBody('');
      await queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createCommentMutation.mutate({ body: commentBody.trim() });
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading comments…</p>
      ) : error ? (
        <p style={{ fontSize: 13, color: '#ef4444' }}>Could not load comments.</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>No comments yet. Start the conversation.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {comments.map(comment => (
            <div key={comment.id} id={`comment-${comment.id}`} style={{ display: 'flex', gap: 10 }}>
              <Avatar name={comment.author_display_name ?? 'Member'} avatar={comment.author_avatar_url} size={32} />
              <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 12, padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{comment.author_display_name ?? 'Member'}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{comment.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submitComment} style={{ display: 'flex', gap: 8 }}>
        <input
          id={`comment-input-${postId}`}
          className="input"
          value={commentBody}
          onChange={e => setCommentBody(e.target.value)}
          placeholder="Write a comment…"
          disabled={createCommentMutation.isPending}
        />
        <button
          id={`comment-submit-${postId}`}
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!commentBody.trim() || createCommentMutation.isPending}
        >
          {createCommentMutation.isPending ? 'Posting…' : 'Post'}
        </button>
      </form>
    </div>
  );
}
