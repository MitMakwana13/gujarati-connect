'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileService } from '@/lib/services/profile.service';
import { LocationService } from '@/lib/services/location.service';
import { useAuth } from '@/lib/auth-context';
import { MapPin, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [nativeCity, setNativeCity] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.name && profile?.native_city) {
      router.push('/nearby');
    }
    if (profile) {
      setName(profile.name || '');
      setProfession(profile.profession || '');
      setNativeCity(profile.native_city || '');
      setPhotoUrl(profile.photo_url || '');
    }
  }, [profile, router]);

  const handleStep1 = () => {
    if (!name.trim()) return toast.error('Name is required');
    if (!profession.trim()) return toast.error('Profession is required');
    setStep(2);
  };

  const handleDetectLocation = async () => {
    setLoading(true);
    toast.loading('Detecting location...', { id: 'loc' });
    try {
      const pos = await LocationService.getCurrentLocation();
      const geo = await LocationService.reverseGeocode(pos.lat, pos.lng);
      await LocationService.saveLocation(pos.lat, pos.lng, pos.accuracy, geo.city, geo.country);
      toast.success('Location saved! 📍', { id: 'loc' });
      setStep(3);
    } catch {
      toast.error('Could not detect location. Please allow access.', { id: 'loc' });
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    if (!nativeCity.trim()) return toast.error('Native city is required');
    setLoading(true);
    try {
      let finalPhotoUrl: string | null = photoUrl;
      if (file && user) {
        finalPhotoUrl = await ProfileService.uploadAvatar(user.id, file);
      }
      await ProfileService.updateProfile({
        name, profession, native_city: nativeCity, photo_url: finalPhotoUrl
      });
      await refreshProfile();
      toast.success('Profile completed! 🎉');
      router.push('/nearby');
    } catch (e: any) {
      toast.error(e.message || 'Error saving profile');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 bg-[#0A0E19] text-white">
      
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-transparent opacity-50 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="text-[12px] font-semibold tracking-widest text-slate-400 uppercase">
              Step {step} of 3
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                 <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-6 bg-amber-400' : 'w-2.5 bg-white/10'}`} />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-[26px] font-semibold font-['Poppins'] tracking-tight mb-2">Create your profile</h2>
                <p className="text-sm text-slate-400 mb-6">Let other Gujaratis know who you are.</p>

                <div className="flex justify-center mb-6">
                  <label className="relative w-24 h-24 rounded-[28px] bg-white/[0.04] border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400/50 hover:bg-white/[0.08] transition overflow-hidden">
                    {(photoUrl || file) ? (
                      <img src={file ? URL.createObjectURL(file) : photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={20} className="text-amber-400 mb-2" />
                        <span className="text-[10px] font-semibold text-slate-400 tracking-wide">PHOTO</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <div className="space-y-3">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl focus:border-amber-400/50 outline-none transition text-[15px]" />
                  <input value={profession} onChange={e => setProfession(e.target.value)} placeholder="Profession" className="w-full p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl focus:border-amber-400/50 outline-none transition text-[15px]"/>
                </div>

                <button onClick={handleStep1} className="mt-8 w-full bg-amber-400 py-3.5 rounded-[18px] font-semibold text-black transition hover:bg-amber-300 active:scale-95 shadow-[0_8px_25px_rgba(245,158,11,0.25)]">
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-[26px] font-semibold font-['Poppins'] tracking-tight mb-2">Location</h2>
                <p className="text-sm text-slate-400 mb-6">Find nearby Gujaratis instantly.</p>

                <button onClick={handleDetectLocation} disabled={loading} className="w-full bg-white/[0.06] border border-white/10 p-5 rounded-[24px] hover:bg-white/[0.1] transition active:scale-95 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <span className="font-semibold text-[15px]">Detect GPS Location</span>
                </button>

                <p className="text-[12px] text-slate-500 mt-4 text-center leading-relaxed">
                  We fuzz your exact coordinates for privacy. Only distance is shown.
                </p>

                <button onClick={() => setStep(3)} className="mt-8 w-full border border-white/10 py-3.5 rounded-[18px] font-medium text-slate-300 transition hover:bg-white/[0.08] active:scale-95">
                  Skip for now
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-[26px] font-semibold font-['Poppins'] tracking-tight mb-2">Your roots</h2>
                <p className="text-sm text-slate-400 mb-6">Where in Gujarat is your family from?</p>

                <input value={nativeCity} onChange={e => setNativeCity(e.target.value)} placeholder="e.g. Surat, Ahmedabad, Rajkot" className="w-full p-4 bg-white/[0.04] border border-white/10 rounded-2xl focus:border-amber-400/50 outline-none transition text-[15px]"/>

                <button onClick={handleFinish} disabled={loading} className="mt-8 w-full bg-amber-400 py-3.5 rounded-[18px] font-semibold text-black transition hover:bg-amber-300 active:scale-95 shadow-[0_8px_25px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2">
                  {loading && <span className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />}
                  Finish Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}
