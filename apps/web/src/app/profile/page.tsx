'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap } from '@/lib/motion';

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [bio, setBio] = useState('Passionate about connecting with the community.');
  const [city, setCity] = useState('San Francisco, CA');
  const [roots, setRoots] = useState('Ahmedabad, Gujarat');
  const [industry, setIndustry] = useState('Technology');
  const [role, setRole] = useState('Software Engineer');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate network request
    setSaving(false);
    setEditing(false);
  }

  const v = rm ? undefined : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={v} initial="hidden" animate="visible" className="card" style={{ padding: 32, overflow: 'hidden', position: 'relative' }}>
          
          {/* Header Graphic */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(135deg, hsla(32,98%,55%,0.6), hsla(247,75%,64%,0.8))', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24, alignItems: 'flex-end', marginTop: 40, marginBottom: 24 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-base)', border: '4px solid var(--bg-surface)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {user.avatarInitials}
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{user.displayName}</h1>
                {!editing ? (
                  <motion.button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} whileTap={buttonTap}>✏️ Edit Profile</motion.button>
                ) : null}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>{role}</p>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: 24 }} />

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.form 
                key="edit-form"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSave}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" htmlFor="city">Current City</label>
                    <input id="city" className="input" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="roots">Hometown / Roots</label>
                    <input id="roots" className="input" value={roots} onChange={e => setRoots(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" htmlFor="industry">Industry</label>
                    <select id="industry" className="input" value={industry} onChange={e => setIndustry(e.target.value)}>
                      <option>Technology</option><option>Finance</option><option>Healthcare</option><option>Education</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="role">Role / Title</label>
                    <input id="role" className="input" value={role} onChange={e => setRole(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="bio">About Me</label>
                  <textarea id="bio" className="input" rows={4} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'none' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                  <motion.button type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="view-profile"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>About</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{bio}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                  <div>
                    <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Location</h3>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>📍 {city}</p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Roots</h3>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>🏡 {roots}</p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Industry</h3>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>💼 {industry}</p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Verification Status</h3>
                    <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--brand-teal)' }}>✓ Email Verified</p>
                  </div>
                </div>
                
                <div style={{ background: 'hsla(0,0%,15%,0.3)', padding: 16, borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Logged in as <strong>{user.email}</strong>
                  </div>
                  <motion.button className="btn btn-ghost btn-sm" onClick={logout} whileTap={buttonTap} style={{ color: 'var(--brand-rose)' }}>Logout</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
