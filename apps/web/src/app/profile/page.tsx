'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useMyProfile, useUpdateProfile } from '@/hooks/useProfile';
import { fadeUp, buttonTap } from '@/lib/motion';

const USER_TYPES = [
  { value: 'student', label: '🎓 Student' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'entrepreneur', label: '🚀 Entrepreneur' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'organizer', label: '🎉 Organizer' },
];

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const updateProfileMutation = useUpdateProfile();

  // Form fields — populated from API profile once loaded
  const [bio, setBio] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentCountry, setCurrentCountry] = useState('');
  const [homeCityIndia, setHomeCityIndia] = useState('');
  const [homeStateIndia, setHomeStateIndia] = useState('');
  const [userType, setUserType] = useState('professional');
  const [company, setCompany] = useState('');
  const [profession, setProfession] = useState('');
  const [university, setUniversity] = useState('');

  // Populate form from API once loaded
  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '');
      setCurrentCity(profile.current_city ?? '');
      setCurrentCountry(profile.current_country ?? '');
      setHomeCityIndia(profile.home_city_india ?? '');
      setHomeStateIndia(profile.home_state_india ?? '');
      setUserType(profile.user_type ?? 'professional');
      setCompany(profile.company ?? '');
      setProfession(profile.profession ?? '');
      setUniversity(profile.university ?? '');
    }
  }, [profile]);

  useEffect(() => { if (!authLoading && !user) router.push('/auth/login'); }, [user, authLoading, router]);
  if (authLoading || profileLoading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>⏳</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading profile…</span>
      </div>
    </div>
  );

  if (!user) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const updates: Record<string, unknown> = {};
    if (bio !== (profile?.bio ?? '')) updates.bio = bio;
    if (currentCity !== (profile?.current_city ?? '')) updates.currentCity = currentCity;
    if (currentCountry !== (profile?.current_country ?? '')) updates.currentCountry = currentCountry;
    if (homeCityIndia !== (profile?.home_city_india ?? '')) updates.homeCityIndia = homeCityIndia;
    if (homeStateIndia !== (profile?.home_state_india ?? '')) updates.homeStateIndia = homeStateIndia;
    if (userType !== (profile?.user_type ?? 'professional')) updates.userType = userType;
    if (company !== (profile?.company ?? '')) updates.company = company;
    if (profession !== (profile?.profession ?? '')) updates.profession = profession;
    if (university !== (profile?.university ?? '')) updates.university = university;

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      return;
    }

    updateProfileMutation.mutate(updates, {
      onSuccess: () => { setEditing(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); },
      onError: (err: any) => { setFormError(err?.message ?? 'Failed to save profile. Please try again.'); },
    });
  }

  const v = rm ? undefined : fadeUp;
  const displayName = profile?.display_name ?? user.displayName ?? 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={v} initial="hidden" animate="visible" className="card" style={{ padding: 32, overflow: 'hidden', position: 'relative' }}>

          {/* Header gradient */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(135deg, hsla(32,98%,55%,0.6), hsla(247,75%,64%,0.8))', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24, alignItems: 'flex-end', marginTop: 40, marginBottom: 24 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-base)', border: '4px solid var(--bg-surface)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : initials}
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{displayName}</h1>
                {!editing && (
                  <motion.button id="edit-profile-btn" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} whileTap={buttonTap}>✏️ Edit Profile</motion.button>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                {profile?.profession || profile?.user_type || user.email}
              </p>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: 24 }} />

          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="success-feedback"
                style={{ marginBottom: 16 }}
              >
                ✓ Profile updated successfully
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.form
                key="edit-form"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSave}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label className="form-label" htmlFor="bio">About Me</label>
                  <textarea id="bio" className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'none' }} placeholder="Tell the community about yourself…" maxLength={500} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{bio.length}/500</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" htmlFor="city">Current City</label>
                    <input id="city" className="input" value={currentCity} onChange={e => setCurrentCity(e.target.value)} placeholder="e.g. San Jose, CA" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="country">Country</label>
                    <input id="country" className="input" value={currentCountry} onChange={e => setCurrentCountry(e.target.value)} placeholder="e.g. USA" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" htmlFor="homeCity">Hometown in India</label>
                    <input id="homeCity" className="input" value={homeCityIndia} onChange={e => setHomeCityIndia(e.target.value)} placeholder="e.g. Ahmedabad" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="homeState">State</label>
                    <input id="homeState" className="input" value={homeStateIndia} onChange={e => setHomeStateIndia(e.target.value)} placeholder="e.g. Gujarat" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" htmlFor="userType">I am a…</label>
                    <select id="userType" className="input" value={userType} onChange={e => setUserType(e.target.value)}>
                      {USER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="profession">Job Title / Role</label>
                    <input id="profession" className="input" value={profession} onChange={e => setProfession(e.target.value)} placeholder="e.g. Software Engineer" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" htmlFor="company">Company</label>
                    <input id="company" className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="university">University</label>
                    <input id="university" className="input" value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. UC Berkeley" />
                  </div>
                </div>

                {formError && (
                  <div style={{ padding: '12px 16px', background: 'hsla(0,72%,51%,0.12)', border: '1px solid hsla(0,72%,51%,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--brand-rose)', fontSize: 14 }}>
                    ⚠️ {formError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setFormError(''); }} disabled={updateProfileMutation.isPending}>Cancel</button>
                  <motion.button id="save-profile-btn" type="submit" className="btn btn-primary" whileTap={buttonTap} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="view-profile"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                {profile?.bio && (
                  <>
                    <h3 style={{ fontSize: 16, marginBottom: 8 }}>About</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{profile.bio}</p>
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                  {(profile?.current_city || profile?.current_country) && (
                    <div>
                      <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Location</h3>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>📍 {[profile.current_city, profile.current_country].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {(profile?.home_city_india || profile?.home_state_india) && (
                    <div>
                      <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Roots</h3>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>🏡 {[profile.home_city_india, profile.home_state_india].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {(profile?.profession || profile?.company) && (
                    <div>
                      <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Work</h3>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>💼 {[profile.profession, profile.company].filter(Boolean).join(' at ')}</p>
                    </div>
                  )}
                  {profile?.university && (
                    <div>
                      <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Education</h3>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>🎓 {profile.university}</p>
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Account</h3>
                    <p style={{ fontSize: 15, fontWeight: 500, color: profile?.email_verified ? 'var(--brand-teal)' : 'var(--text-muted)' }}>
                      {profile?.email_verified ? '✓ Email Verified' : 'Email not verified'}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'hsla(0,0%,15%,0.3)', padding: 16, borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Logged in as <strong>{user.email}</strong>
                  </div>
                  <motion.button id="logout-btn" className="btn btn-ghost btn-sm" onClick={logout} whileTap={buttonTap} style={{ color: 'var(--brand-rose)' }}>Logout</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
