'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { EventService } from '@/lib/services/event.service';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

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
];

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [maxAttendees, setMaxAttendees] = useState('');
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
    if (!title.trim() || !eventDate) {
      toast.error('Title and date are required');
      return;
    }

    setLoading(true);
    try {
      let image_url: string | undefined;
      if (imageFile) {
        const url = await EventService.uploadEventImage(imageFile);
        if (url) image_url = url;
      }

      await EventService.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        city: city || undefined,
        event_date: new Date(eventDate).toISOString(),
        image_url,
        is_free: isFree,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      });

      toast.success('🎉 Event created!');
      router.push('/events');
    } catch (err) {
      toast.error('Failed to create event');
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
        <h1 className="text-[18px] font-bold font-serif text-[var(--text)]">Create Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 space-y-4">
        {/* Cover Image */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Cover Image
          </label>
          <label className="relative cursor-pointer block">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative rounded-[var(--r2)] overflow-hidden h-[180px]">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <motion.div
                whileHover={{ borderColor: 'var(--saffron)' }}
                className="h-[140px] border-2 border-dashed border-[var(--border2)] rounded-[var(--r2)] flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <ImageIcon size={28} className="text-[var(--text3)]" />
                <span className="text-[12px] text-[var(--text3)]">Tap to upload cover photo</span>
              </motion.div>
            )}
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Event Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Navratri Night · Diwali Milap · ..."
            className="w-full h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell people what to expect..."
            rows={3}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 py-3 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors resize-none"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em] flex items-center gap-1.5">
            <Calendar size={11} /> Date & Time *
          </label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 text-[14px] text-[var(--text)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
          />
        </div>

        {/* Venue */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em] flex items-center gap-1.5">
            <MapPin size={11} /> Venue
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Hall name, address..."
            className="w-full h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            City
          </label>
          <div className="flex flex-wrap gap-2">
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

        {/* Free / Paid */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Ticket
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsFree(true)}
              className={`flex-1 h-[44px] rounded-[var(--r)] text-[12px] font-bold border transition-all ${
                isFree
                  ? 'bg-[rgba(26,174,163,0.08)] border-[var(--teal)] text-[var(--teal-light)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text3)]'
              }`}
            >
              🎟 FREE
            </button>
            <button
              type="button"
              onClick={() => setIsFree(false)}
              className={`flex-1 h-[44px] rounded-[var(--r)] text-[12px] font-bold border transition-all ${
                !isFree
                  ? 'bg-[rgba(232,137,42,0.08)] border-[var(--saffron)] text-[var(--saffron)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text3)]'
              }`}
            >
              💳 PAID
            </button>
          </div>
        </div>

        {/* Max Attendees */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text3)] mb-2 uppercase tracking-[0.08em]">
            Max Attendees (optional)
          </label>
          <input
            type="number"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            placeholder="Leave blank for unlimited"
            min="1"
            className="w-full h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] px-4 text-[14px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--saffron)] transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim() || !eventDate}
          className="w-full h-[52px] bg-[var(--saffron)] text-white font-bold text-[14px] rounded-[var(--r2)] shadow-lg shadow-[rgba(232,137,42,0.25)] hover:bg-[var(--saffron-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : '🎉 PUBLISH EVENT'}
        </button>
      </form>
    </div>
  );
}
