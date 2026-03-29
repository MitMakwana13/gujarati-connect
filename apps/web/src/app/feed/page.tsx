'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { usePosts, useToggleLike, useCreatePost } from '@/hooks/usePosts';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, cardHover, buttonTap, scalePop, reduced } from '@/lib/motion';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Post {
  id: string;
  author: { name: string; avatar: string; city: string; initials: string };
  body: string;
  time: string;
  likes: number;
  comments: number;
  tags: string[];
  liked: boolean;
  group?: string;
}

const SEED_POSTS: Post[] = [
  { id: '1', author: { name: 'Ananya Shah', avatar: '🧕', city: 'Chicago, IL', initials: 'AS' }, body: 'Incredible Navratri celebration last week at the Chicago Gujarati Association! Over 800 people came out. Who is looking forward to next year?', time: '2h ago', likes: 128, comments: 34, tags: ['#Navratri', '#ChicagoGujaratis'], liked: false, group: 'Chicago Gujarati Assoc.' },
  { id: '2', author: { name: 'Vivek Patel', avatar: '👨‍💻', city: 'San Francisco, CA', initials: 'VP' }, body: 'Just wrapped my H-1B transition after 3 years on OPT. Happy to answer questions especially around RFEs and specialty occupation. Drop questions below.', time: '5h ago', likes: 94, comments: 41, tags: ['#H1B', '#Immigration'], liked: false },
  { id: '3', author: { name: 'Priya Mehta', avatar: '👩‍🎓', city: 'Boston, MA', initials: 'PM' }, body: 'Looking for 1 more roommate near BU/Northeastern for next semester. Vegetarian household, clean and quiet. DM if interested!', time: '8h ago', likes: 57, comments: 22, tags: ['#Boston', '#Housing'], liked: false },
];

const SUGGESTED_GROUPS = [
  { id: '1', name: 'Bay Area Gujaratis', members: 3400, emoji: '🌉', joined: false },
  { id: '2', name: 'GJ Startup Network', members: 1200, emoji: '🚀', joined: false },
  { id: '3', name: 'Jain Community USA', members: 890, emoji: '🕉️', joined: false },
];

const UPCOMING_EVENTS = [
  { id: '1', title: 'Garba Night — NYC', date: 'Apr 5', city: 'New York' },
  { id: '2', title: 'Career Mixer London', date: 'Apr 13', city: 'London' },
];

const SIDEBAR_LINKS = [
  { href: '/feed',      icon: '🏠', label: 'Home Feed' },
  { href: '/discover',  icon: '🔍', label: 'Discover' },
  { href: '/groups',    icon: '👥', label: 'My Groups' },
  { href: '/events',    icon: '🎉', label: 'Events' },
  { href: '/resources', icon: '📋', label: 'Resources' },
  { href: '/messages',  icon: '💬', label: 'Messages' },
  { href: '/profile',   icon: '👤', label: 'Profile' },
  { href: '/settings',  icon: '⚙️', label: 'Settings' },
];

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { data: postsData, isLoading: postsLoading } = usePosts();
  const toggleLikeMutation = useToggleLike();
  const createPostMutation = useCreatePost();
  
  const posts = postsData || [];
  
  const [groups, setGroups] = useState(SUGGESTED_GROUPS);
  const [composeText, setComposeText] = useState('');
  const [composeFocused, setComposeFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [user, isLoading, router]);

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

  function toggleJoin(id: string) {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, joined: !g.joined } : g));
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!composeText.trim()) return;
    
    createPostMutation.mutate({
      body: composeText,
      contentType: 'text',
      mediaUrls: [],
    }, {
      onSuccess: () => {
        setComposeText('');
        setComposeFocused(false);
      }
    });
  }

  const staggerVariants = reduced ? reduced.stagger : stagger.normal;
  const itemVariants = reduced ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div className="app-layout">
        {/* Left sidebar */}
        <aside className="sidebar">
          {SIDEBAR_LINKS.map(item => (
            <motion.a
              key={item.href}
              href={item.href}
              className={`sidebar-item${item.href === '/feed' ? ' active' : ''}`}
              whileHover={reduced ? undefined : { x: 4 }}
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

        {/* Feed column */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Compose */}
          <motion.div
            className="card"
            style={{ padding: 20 }}
            variants={reduced ? undefined : fadeUp}
            initial="hidden"
            animate="visible"
          >
            <form onSubmit={e => { void handlePost(e); }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))',
                  display: 'grid', placeItems: 'center',
                  fontSize: 14, fontWeight: 800, color: 'var(--text-inverse)',
                }}>
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
                {(composeFocused || composeText) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                      <motion.button type="button" className="btn btn-ghost btn-sm" whileTap={buttonTap} onClick={() => { setComposeFocused(false); setComposeText(''); }}>Cancel</motion.button>
                      <motion.button id="post-submit" type="submit" className="btn btn-primary btn-sm" whileTap={buttonTap} disabled={!composeText.trim() || createPostMutation.isPending}>
                        {createPostMutation.isPending ? 'Posting…' : 'Post'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!composeFocused && !composeText && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button type="button" id="compose-photo" className="btn btn-ghost btn-sm" onClick={() => setComposeFocused(true)}>📷 Photo</button>
                  <button type="button" id="compose-event" className="btn btn-ghost btn-sm" onClick={() => router.push('/events')}>🎉 Event</button>
                  <button type="button" id="compose-resource" className="btn btn-ghost btn-sm" onClick={() => router.push('/resources')}>📋 Resource</button>
                </div>
              )}
            </form>
          </motion.div>

          {/* Posts */}
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <EmptyState icon="✨" title="Your feed is empty" description="Follow some communities and connect with people to see their posts here." action={{ label: 'Discover people', onClick: () => router.push('/discover') }} />
          ) : (
            <motion.div
              className="feed"
              variants={staggerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {posts.map(post => (
                  <motion.article
                    key={post.id}
                    id={`post-${post.id}`}
                    className="card post-card"
                    variants={itemVariants}
                    layout
                    whileHover={reduced ? undefined : cardHover.hover}
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
                          <span>📍 {post.author.city}</span>
                          {post.group && <><span>·</span><span>in <span style={{ color: 'var(--brand-indigo)' }}>{post.group}</span></span></>}
                          <span>· {post.time}</span>
                        </div>
                      </div>
                      <button id={`post-menu-${post.id}`} className="btn btn-ghost btn-xs">•••</button>
                    </header>

                    <p className="post-body">{post.body}</p>

                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {post.tags.map(tag => <span key={tag} className="badge badge-indigo" style={{ fontSize: 11 }}>{tag}</span>)}
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
                            {post.liked ? '👍' : '👍'}
                          </motion.span>
                        </AnimatePresence>
                        {post.liked ? 'Liked' : 'Like'}
                        <span style={{ color: 'var(--text-muted)' }}>{post.likes}</span>
                      </motion.button>
                      <motion.button id={`comment-${post.id}`} className="btn btn-ghost btn-sm" whileTap={buttonTap}>
                        💬 Comment <span style={{ color: 'var(--text-muted)' }}>{post.comments}</span>
                      </motion.button>
                      <motion.button id={`share-${post.id}`} className="btn btn-ghost btn-sm" whileTap={buttonTap}>
                        ↗ Share
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

        {/* Right rail */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Suggested groups */}
          <motion.div className="card" style={{ padding: 20 }} variants={reduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: 15 }}>Suggested Groups</h3>
              <a href="/groups" className="section-link">See all</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groups.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{g.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.members.toLocaleString()} members</div>
                  </div>
                  <motion.button
                    id={`rail-join-${g.id}`}
                    className={`btn btn-sm ${g.joined ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={() => toggleJoin(g.id)}
                    whileTap={buttonTap}
                    style={{ color: g.joined ? 'var(--brand-teal)' : undefined, fontSize: 12, padding: '4px 11px' }}
                  >
                    {g.joined ? '✓' : 'Join'}
                  </motion.button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming events */}
          <motion.div className="card" style={{ padding: 20 }} variants={reduced ? undefined : fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: 15 }}>Upcoming Events</h3>
              <a href="/events" className="section-link">See all</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {UPCOMING_EVENTS.map(evt => (
                <div key={evt.id} style={{ borderLeft: '3px solid var(--brand-saffron)', paddingLeft: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{evt.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📅 {evt.date} · 📍 {evt.city}</div>
                  <a href="/events" className="btn btn-secondary btn-sm" style={{ marginTop: 8, display: 'inline-flex', fontSize: 12 }}>RSVP →</a>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Discover prompt */}
          <motion.div
            className="card"
            style={{ padding: 20, background: 'linear-gradient(135deg, hsla(247,75%,64%,0.12), hsla(32,98%,55%,0.08))' }}
            variants={reduced ? undefined : fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.35 }}
          >
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
