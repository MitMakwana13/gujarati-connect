'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Phone, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { BusinessService } from '@/lib/services/business.service';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Food & Dining',
  'Retail',
  'Finance',
  'Tech',
  'Healthcare',
  'Education',
  'Real Estate',
  'Hospitality',
  'Services',
  'Other',
];
const CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'London',
  'New York',
  'Toronto',
  'Dubai',
  'Sydney',
  'Singapore',
];

export default function AddBusinessPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push('/');
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Business name is required');
      return;
    }

    setLoading(true);
    try {
      let image_url: string | undefined;
      if (imageFile) {
        const url = await BusinessService.uploadBusinessImage(imageFile);
        if (url) image_url = url;
      }

      await BusinessService.createBusiness({
        name: name.trim(),
        category: category || undefined,
        description: description.trim() || undefined,
        city: city || undefined,
        country: country.trim() || undefined,
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        image_url,
      });

      toast.success('🏢 Business listed!');
      router.push('/businesses');
    } catch (err) {
      toast.error('Failed to add business');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-[12px] bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center"
        >
          <ArrowLeft size={16} className="text-[var(--text2)]" />
        </button>
        <h1 className="text-[18px] font-bold font-serif text-[var(--text)]">Add Your Business</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 space-y-4">
        {/* Logo */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Business Logo / Image
          </label>
          <label className="relative cursor-pointer block">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative w-24 h-24 rounded-[20px] overflow-hidden">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <motion.div
                whileHover={{ borderColor: 'var(--saffron)' }}
                className="w-24 h-24 border-2 border-dashed border-[var(--border2)] rounded-[20px] flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <ImageIcon size={22} className="text-[var(--text3)]" />
                <span className="text-[9px] text-[var(--text3)] text-center leading-tight">
                  Upload
                  <br />
                  Logo
                </span>
              </motion.div>
            )}
          </label>
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Business Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Patel Sweets · Shah Jewellers · ..."
            className="w-full h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={`topic-chip text-[11px] ${category === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the community what you offer..."
            rows={3}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 py-3 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors resize-none"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            City
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(city === c ? '' : c)}
                className={`topic-chip text-[11px] ${city === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Country
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="India, UK, USA, Canada..."
            className="w-full h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
          />
        </div>

        {/* Website & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em] flex items-center gap-1">
              <Globe size={10} /> Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="example.com"
              className="w-full h-[44px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em] flex items-center gap-1">
              <Phone size={10} /> Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 ..."
              className="w-full h-[44px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full h-[52px] bg-[var(--saffron)] text-white font-bold text-[14px] rounded-[var(--r2)] shadow-lg shadow-[rgba(232,137,42,0.25)] hover:bg-[var(--saffron-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : '🏢 LIST BUSINESS'}
        </button>
      </form>
    </div>
  );
}
