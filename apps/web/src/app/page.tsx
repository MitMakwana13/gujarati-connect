import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gujarati Global — Your Global Diaspora Community',
  description: 'Find events, join groups, and connect with Gujaratis in your city and across the world.',
};

const STATS = [
  { value: '50K+', label: 'Community Members' },
  { value: '120+', label: 'Cities Worldwide' },
  { value: '2K+', label: 'Monthly Events' },
  { value: '800+', label: 'Active Groups' },
];

const FEATURES = [
  {
    icon: '🌍',
    title: 'Global & Local',
    description: 'Connect with your city chapter or explore the worldwide Gujarati network.',
  },
  {
    icon: '🎉',
    title: 'Events & Garba',
    description: 'Discover cultural events, Navratri celebrations, career meetups, and more.',
  },
  {
    icon: '👥',
    title: 'Groups & Communities',
    description: 'Join interest groups for entrepreneurs, students, families, and professionals.',
  },
  {
    icon: '🏡',
    title: 'Resource Board',
    description: 'Community-powered listings for housing, airport pickups, H-1B help, and more.',
  },
  {
    icon: '💬',
    title: 'Safe Messaging',
    description: 'Message request model — no unsolicited DMs. Authentic connections only.',
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    description: 'Granular privacy controls. You decide what to share and with whom.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo"> gujarati global</Link>
          <ul className="nav-links" style={{ display: 'flex', listStyle: 'none', gap: 8 }}>
            <li><Link href="/feed" className="nav-link">Feed</Link></li>
            <li><Link href="/groups" className="nav-link">Groups</Link></li>
            <li><Link href="/events" className="nav-link">Events</Link></li>
            <li><Link href="/resources" className="nav-link">Resources</Link></li>
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Join Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Gradient orbs */}
        <div className="orb orb-saffron" style={{ width: 500, height: 500, top: -100, left: '10%', opacity: 0.6 }} />
        <div className="orb orb-indigo"  style={{ width: 600, height: 600, top: -50, right: '5%',  opacity: 0.5 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="badge badge-saffron animate-fade-up" style={{ marginBottom: 24, fontSize: 13 }}>
            🇮🇳 Built for the Global Gujarati Diaspora
          </div>
          <h1 className="animate-fade-up-delay-1" style={{ fontSize: 'clamp(48px, 7vw, 88px)', marginBottom: 24, maxWidth: 900, margin: '0 auto 24px' }}>
            Your Community,{' '}
            <span style={{ background: 'linear-gradient(135deg, hsl(32,98%,55%), hsl(247,75%,64%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Wherever You Are
            </span>
          </h1>
          <p className="animate-fade-up-delay-2" style={{ fontSize: 20, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Connect with Gujaratis in your city and across the globe. Find events, join groups, discover resources, and build lasting connections.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }} className="animate-fade-up-delay-2">
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              🚀 Join the Community
            </Link>
            <Link href="/feed" className="btn btn-secondary btn-lg">
              Explore Feed
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section style={{ padding: '40px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontFamily: 'Outfit, sans-serif', fontWeight: 800, background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 40, marginBottom: 8 }}>Everything Your Community Needs</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 56, fontSize: 17 }}>Purpose-built for the Gujarati diaspora — not just another social network.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-surface)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, marginBottom: 16 }}>Ready to Find Your Community?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, marginBottom: 36 }}>
            Join tens of thousands of Gujaratis worldwide. Free forever for community members.
          </p>
          <Link href="/auth/register" className="btn btn-primary btn-lg">
            Create Your Profile →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ padding: '32px 24px', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>gujarati global</div>
        <p>Connecting the diaspora · Built with ❤️ for our community</p>
      </footer>
    </div>
  );
}
