'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useCreateResource } from '@/hooks/useResources';
import { fadeUp, buttonTap, scalePop } from '@/lib/motion';

const CATEGORIES = [
  { value: 'housing', label: '🏠 Housing' },
  { value: 'roommate', label: '🛏️ Roommate' },
  { value: 'airport_pickup', label: '✈️ Airport Pickup' },
  { value: 'used_items', label: '📦 Used Items' },
  { value: 'referral', label: '💼 Job Referral' },
  { value: 'student_help', label: '🎓 Student Help' },
  { value: 'h1b_help', label: '📋 H1B / Visa Help' },
  { value: 'local_service', label: '🔧 Local Service' },
  { value: 'other', label: '📌 Other' },
];

const CONTACT_METHODS = [
  { value: 'in_app', label: '💬 In-App Message' },
  { value: 'email', label: '📧 Email' },
  { value: 'phone', label: '📱 Phone' },
];

export default function CreateResourcePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const createResourceMutation = useCreateResource();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('housing');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState('in_app');
  const [contactDetail, setContactDetail] = useState('');
  const [price, setPrice] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    if (contactMethod !== 'in_app' && !contactDetail.trim()) {
      setFormError('Please provide contact details for your chosen contact method.');
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      category,
      description: description.trim(),
      contactMethod,
    };
    if (contactDetail.trim()) payload.contactDetail = contactDetail.trim();
    if (price) payload.price = parseFloat(price);

    createResourceMutation.mutate(payload, {
      onSuccess: () => { router.push('/resources'); },
      onError: (err: any) => { setFormError(err?.message ?? 'Failed to post listing. Please try again.'); },
    });
  }

  const v = rm ? undefined : fadeUp;

  if (createResourceMutation.isSuccess) {
    return (
      <div>
        <AppNav />
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
          <motion.div variants={scalePop} initial="hidden" animate="visible" className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Listing Posted!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Redirecting you to the resource board…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24, paddingLeft: 0 }} onClick={() => router.push('/resources')}>← Back to Resources</button>

        <motion.div variants={v} initial="hidden" animate="visible">
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Post a Listing</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Help the community — housing, rides, H1B help, and more.</p>

          <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label" htmlFor="r-title">Title *</label>
              <input id="r-title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 2BR apartment available in Fremont" required />
            </div>

            <div>
              <label className="form-label" htmlFor="r-category">Category *</label>
              <select id="r-category" className="input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="r-desc">Description *</label>
              <textarea id="r-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ resize: 'none' }} placeholder="Describe your listing in detail…" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" htmlFor="r-contact-method">Contact Via *</label>
                <select id="r-contact-method" className="input" value={contactMethod} onChange={e => setContactMethod(e.target.value)}>
                  {CONTACT_METHODS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="r-price">Price (USD, optional)</label>
                <input id="r-price" type="number" className="input" value={price} onChange={e => setPrice(e.target.value)} placeholder="Leave empty if free" min="0" step="0.01" />
              </div>
            </div>

            {contactMethod !== 'in_app' && (
              <div>
                <label className="form-label" htmlFor="r-contact-detail">
                  {contactMethod === 'email' ? 'Your Email *' : 'Your Phone Number *'}
                </label>
                <input
                  id="r-contact-detail"
                  className="input"
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactDetail}
                  onChange={e => setContactDetail(e.target.value)}
                  placeholder={contactMethod === 'email' ? 'your@email.com' : '+1-555-000-0000'}
                  required
                />
              </div>
            )}

            {formError && (
              <div style={{ padding: '12px 16px', background: 'hsla(0,72%,51%,0.12)', border: '1px solid hsla(0,72%,51%,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--brand-rose)', fontSize: 14 }}>
                ⚠️ {formError}
              </div>
            )}

            <div className="divider" style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.push('/resources')} disabled={createResourceMutation.isPending}>Cancel</button>
              <motion.button id="post-resource-submit" type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={createResourceMutation.isPending || !title.trim() || !description.trim()}>
                {createResourceMutation.isPending ? 'Posting…' : 'Post Listing'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
