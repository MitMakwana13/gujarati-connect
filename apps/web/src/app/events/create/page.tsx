'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap, scalePop } from '@/lib/motion';

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('Garba');
  const [desc, setDesc] = useState('');
  const [capacity, setCapacity] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date || !city || !desc) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    setSuccess(true);
    setTimeout(() => { router.push('/events'); }, 2000);
  }

  const v = rm ? undefined : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24, paddingLeft: 0 }} onClick={() => router.push('/events')}>← Back to Events</button>
        
        {success ? (
          <motion.div variants={scalePop} initial="hidden" animate="visible" className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Event Hosted!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>"{title}" is now visible. Redirecting you to the events page…</p>
          </motion.div>
        ) : (
          <motion.div variants={v} initial="hidden" animate="visible">
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Host an Event</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Plan a meetup, tournament, or celebration.</p>
            
            <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label className="form-label" htmlFor="title">Event Title</label>
                <input id="title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. San Jose Cricket Tournament" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="date">Date</label>
                  <input id="date" type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="time">Time</label>
                  <input id="time" type="time" className="input" value={time} onChange={e => setTime(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="city">Location / City</label>
                  <input id="city" className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. San Jose, CA" required />
                </div>
                <div>
                  <label className="form-label" htmlFor="type">Event Type</label>
                  <select id="type" className="input" value={type} onChange={e => setType(e.target.value)}>
                    <option>Garba</option><option>Career</option><option>Cricket</option><option>Cultural</option><option>Social</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="desc">Details</label>
                <textarea id="desc" className="input" value={desc} onChange={e => setDesc(e.target.value)} rows={4} style={{ resize: 'none' }} placeholder="What should people expect?" required />
              </div>
              
              <div>
                <label className="form-label" htmlFor="cap">Capacity (Optional)</label>
                <input id="cap" type="number" className="input" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Max attendees limit" />
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => router.push('/events')} disabled={submitting}>Cancel</button>
                <motion.button type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={submitting || !title || !date || !desc}>
                  {submitting ? 'Creating…' : 'Publish Event'}
                </motion.button>
              </div>

            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
