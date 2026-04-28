'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useCreateGroup } from '@/hooks/useGroups';
import { fadeUp, buttonTap, scalePop } from '@/lib/motion';

export default function CreateGroupPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const createGroupMutation = useCreateGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'approval'>('open');
  const [tagsInput, setTagsInput] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError('Group name is required.'); return; }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      visibility,
      joinPolicy,
      tags,
    };

    createGroupMutation.mutate(payload, {
      onSuccess: () => { router.push('/groups'); },
      onError: (err: any) => { setFormError(err?.message ?? 'Failed to create group. Please try again.'); },
    });
  }

  const v = rm ? undefined : fadeUp;

  if (createGroupMutation.isSuccess) {
    return (
      <div>
        <AppNav />
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
          <motion.div variants={scalePop} initial="hidden" animate="visible" className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Group Created!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Redirecting you to groups…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24, paddingLeft: 0 }} onClick={() => router.push('/groups')}>← Back to Groups</button>

        <motion.div variants={v} initial="hidden" animate="visible">
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Create a Group</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Build your own community space.</p>

          <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label" htmlFor="group-name">Group Name *</label>
              <input id="group-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bay Area Gujarati Professionals" required />
            </div>

            <div>
              <label className="form-label" htmlFor="group-desc">Description</label>
              <textarea id="group-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'none' }} placeholder="What is this group about?" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" htmlFor="visibility">Visibility</label>
                <select id="visibility" className="input" value={visibility} onChange={e => setVisibility(e.target.value as 'public' | 'private')}>
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="joinPolicy">Who can join?</label>
                <select id="joinPolicy" className="input" value={joinPolicy} onChange={e => setJoinPolicy(e.target.value as 'open' | 'approval')}>
                  <option value="open">Anyone</option>
                  <option value="approval">Approval required</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="tags">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
              <input id="tags" className="input" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. cricket, career, bay area" />
            </div>

            {formError && (
              <div style={{ padding: '12px 16px', background: 'hsla(0,72%,51%,0.12)', border: '1px solid hsla(0,72%,51%,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--brand-rose)', fontSize: 14 }}>
                ⚠️ {formError}
              </div>
            )}

            <div className="divider" style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.push('/groups')} disabled={createGroupMutation.isPending}>Cancel</button>
              <motion.button id="create-group-submit" type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={createGroupMutation.isPending || !name.trim()}>
                {createGroupMutation.isPending ? 'Creating…' : 'Create Group'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
