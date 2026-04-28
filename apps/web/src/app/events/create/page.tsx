'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useCreateEvent } from '@/hooks/useEvents';
import { fadeUp, buttonTap, scalePop } from '@/lib/motion';

const EVENT_TYPES = ['garba', 'meetup', 'career', 'cricket', 'cultural', 'social', 'religious', 'volunteering', 'other'];

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const createEventMutation = useCreateEvent();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [eventType, setEventType] = useState('social');
  const [desc, setDesc] = useState('');
  const [capacity, setCapacity] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!title || !date || !time || !desc) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Combine date + time into ISO string
    const startsAt = new Date(`${date}T${time}:00`).toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const payload: Record<string, unknown> = {
      title,
      description: desc,
      eventType,
      venueName: venueName || null,
      startsAt,
      timezone,
    };
    if (capacity) payload.maxAttendees = parseInt(capacity, 10);

    createEventMutation.mutate(payload, {
      onSuccess: () => {
        router.push('/events');
      },
      onError: (err: any) => {
        setFormError(err?.message ?? 'Failed to create event. Please try again.');
      },
    });
  }

  const v = rm ? undefined : fadeUp;

  if (createEventMutation.isSuccess) {
    return (
      <div>
        <AppNav />
        <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
          <motion.div variants={scalePop} initial="hidden" animate="visible" className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Event Created!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Redirecting you to the events page…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24, paddingLeft: 0 }} onClick={() => router.push('/events')}>← Back to Events</button>

        <motion.div variants={v} initial="hidden" animate="visible">
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Host an Event</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Plan a meetup, tournament, or celebration.</p>

          <form onSubmit={e => { void handleSubmit(e); }} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label" htmlFor="title">Event Title *</label>
              <input id="title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. San Jose Cricket Tournament" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" htmlFor="date">Date *</label>
                <input id="date" type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div>
                <label className="form-label" htmlFor="time">Time *</label>
                <input id="time" type="time" className="input" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" htmlFor="venue">Venue / Location</label>
                <input id="venue" className="input" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Fremont Community Center" />
              </div>
              <div>
                <label className="form-label" htmlFor="type">Event Type</label>
                <select id="type" className="input" value={eventType} onChange={e => setEventType(e.target.value)}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="desc">Description *</label>
              <textarea id="desc" className="input" value={desc} onChange={e => setDesc(e.target.value)} rows={4} style={{ resize: 'none' }} placeholder="What should people expect?" required />
            </div>

            <div>
              <label className="form-label" htmlFor="cap">Max Capacity (Optional)</label>
              <input id="cap" type="number" className="input" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Leave empty for unlimited" min="1" />
            </div>

            {formError && (
              <div style={{ padding: '12px 16px', background: 'hsla(0,72%,51%,0.12)', border: '1px solid hsla(0,72%,51%,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--brand-rose)', fontSize: 14 }}>
                ⚠️ {formError}
              </div>
            )}

            <div className="divider" style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.push('/events')} disabled={createEventMutation.isPending}>Cancel</button>
              <motion.button type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={createEventMutation.isPending || !title || !date || !time || !desc}>
                {createEventMutation.isPending ? 'Creating…' : 'Publish Event'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
