'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap, scalePop } from '@/lib/motion';

export default function CreateListingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('housing');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [contact, setContact] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !city || !desc || !contact) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    setSuccess(true);
    setTimeout(() => { router.push('/resources'); }, 2000);
  }

  const v = rm ? undefined : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24, paddingLeft: 0 }} onClick={() => router.push('/resources')}>← Back to Resources</button>
        
        {success ? (
          <motion.div variants={scalePop} initial="hidden" animate="visible" className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Listing Posted!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your listing is now active on the community board. Redirecting…</p>
          </motion.div>
        ) : (
          <motion.div variants={v} initial="hidden" animate="visible">
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Post a Resource</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Share housing, rides, job referrals, or items with the community.</p>
            
            <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label className="form-label" htmlFor="title">Listing Title</label>
                <input id="title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 2BR available near BU" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="cat">Category</label>
                  <select id="cat" className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="housing">Housing</option>
                    <option value="airport">Airport Pickups</option>
                    <option value="visa">H-1B / Visa Help</option>
                    <option value="student">Student Support</option>
                    <option value="jobs">Job Referrals</option>
                    <option value="items">Used Items</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="city">City / Location</label>
                  <input id="city" className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Boston, MA" required />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="desc">Description</label>
                <textarea id="desc" className="input" value={desc} onChange={e => setDesc(e.target.value)} rows={4} style={{ resize: 'none' }} placeholder="Provide specific details about your listing." required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="price">Price (if applicable)</label>
                  <input id="price" className="input" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. $1,200/mo or Free" />
                </div>
                <div>
                  <label className="form-label" htmlFor="contact">Contact Preference</label>
                  <select id="contact" className="input" value={contact} onChange={e => setContact(e.target.value)} required>
                    <option value="">Select option...</option>
                    <option value="DM">DM on Gujarati Global</option>
                    <option value="Email">Email me</option>
                    <option value="Phone">Call/Text me</option>
                  </select>
                </div>
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => router.push('/resources')} disabled={submitting}>Cancel</button>
                <motion.button type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={submitting || !title || !city || !desc || !contact}>
                  {submitting ? 'Posting…' : 'Post Listing'}
                </motion.button>
              </div>

            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
