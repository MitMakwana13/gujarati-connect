'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap, scalePop } from '@/lib/motion';

export default function CreateGroupPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [visibility, setVisibility] = useState('Public');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !description) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    setSuccess(true);
    setTimeout(() => { router.push('/groups'); }, 2000);
  }

  const v = rm ? undefined : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24, paddingLeft: 0 }} onClick={() => router.push('/groups')}>← Back to Groups</button>
        
        {success ? (
          <motion.div variants={scalePop} initial="hidden" animate="visible" className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Group Created!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>"{name}" is now live. Redirecting you to the groups page…</p>
          </motion.div>
        ) : (
          <motion.div variants={v} initial="hidden" animate="visible">
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Create a Group</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Build a space for your community, industry, or city.</p>
            
            <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="emoji">Emoji</label>
                  <input id="emoji" className="input" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ textAlign: 'center', fontSize: 24 }} maxLength={2} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="name">Group Name</label>
                  <input id="name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NYC Gujarati Youth" required />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="desc">Description</label>
                <textarea id="desc" className="input" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ resize: 'none' }} placeholder="What is this group about?" required />
              </div>
              
              <div>
                <label className="form-label" htmlFor="vis">Visibility</label>
                <select id="vis" className="input" value={visibility} onChange={e => setVisibility(e.target.value)}>
                  <option value="Public">Public — Anyone can join and see posts</option>
                  <option value="Private">Private — Approval required, hidden posts</option>
                </select>
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => router.push('/groups')} disabled={submitting}>Cancel</button>
                <motion.button type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={submitting || !name || !description}>
                  {submitting ? 'Creating…' : 'Create Group'}
                </motion.button>
              </div>

            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
