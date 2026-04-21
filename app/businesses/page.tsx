'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Search, Globe, Phone, MapPin } from 'lucide-react';
import { BusinessService } from '@/lib/services/business.service';
import { Business } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

const CITIES = [
  'All Cities',
  'Ahmedabad',
  'Surat',
  'Mumbai',
  'London',
  'New York',
  'Toronto',
  'Dubai',
];

const CATEGORIES = [
  'All',
  'Food & Dining',
  'Retail',
  'Finance',
  'Tech',
  'Healthcare',
  'Education',
  'Real Estate',
  'Hospitality',
  'Services',
];

const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Dining': '🍛',
  Retail: '🛍️',
  Finance: '💰',
  Tech: '💻',
  Healthcare: '🏥',
  Education: '📚',
  'Real Estate': '🏠',
  Hospitality: '🏨',
  Services: '⚙️',
};

function getCategoryEmoji(cat: string | null): string {
  if (!cat) return '🏢';
  for (const key of Object.keys(CATEGORY_EMOJI)) {
    if (cat.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return CATEGORY_EMOJI[key];
    }
  }
  return '🏢';
}

export default function BusinessesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [catFilter, setCatFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const city = cityFilter === 'All Cities' ? undefined : cityFilter;
      const cat = catFilter === 'All' ? undefined : catFilter;
      const data = await BusinessService.getBusinesses(city, cat);
      setBusinesses(data);
    } catch {
      toast.error('Could not load businesses');
    } finally {
      setLoading(false);
    }
  }, [cityFilter, catFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = searchQuery.trim()
    ? businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : businesses;

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="sec-title !mb-0">Business Directory</div>
          {user && (
            <button
              onClick={() => router.push('/businesses/add')}
              className="flex items-center gap-1.5 bg-[var(--saffron)] text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-lg shadow-[rgba(232,137,42,0.3)] hover:bg-[var(--saffron-dark)] transition-all active:scale-95"
            >
              <Plus size={13} />
              ADD BIZ
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]"
          />
          <input
            type="text"
            placeholder="Search businesses, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[42px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] pl-9 pr-4 text-[13px] text-[var(--text)] placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--border2)] transition-colors"
          />
        </div>

        {/* City Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={`topic-chip shrink-0 ${cityFilter === city ? 'active' : ''}`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`topic-chip shrink-0 ${catFilter === cat ? 'active' : ''}`}
            >
              {cat !== 'All' && <span>{CATEGORY_EMOJI[cat] ?? '🏢'}</span>}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Banner */}
      {!loading && (
        <div className="px-5 mb-4">
          <div className="bg-gradient-to-r from-[rgba(232,137,42,0.06)] to-[rgba(26,174,163,0.06)] border border-[var(--border)] rounded-[var(--r2)] p-4 flex items-center justify-between">
            <div>
              <div className="text-[22px] font-bold font-serif text-[var(--saffron)]">
                {filtered.length}
              </div>
              <div className="text-[11px] text-[var(--text3)] uppercase tracking-[0.06em] font-semibold">
                Businesses Listed
              </div>
            </div>
            <div className="text-4xl opacity-20">🏢</div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="biz-card animate-pulse">
              <div className="w-14 h-14 rounded-[14px] bg-[var(--surface3)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--surface3)] rounded w-2/3" />
                <div className="h-3 bg-[var(--surface3)] rounded w-1/3" />
                <div className="h-3 bg-[var(--surface3)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Business Cards */}
      {!loading && (
        <div className="px-5 space-y-3">
          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-5xl mb-3">🏢</div>
                <p className="text-[var(--text3)] text-sm font-medium">No businesses found</p>
                {user && (
                  <button
                    onClick={() => router.push('/businesses/add')}
                    className="mt-4 bg-[var(--saffron)] text-white px-6 py-2.5 rounded-full text-[12px] font-bold"
                  >
                    BE THE FIRST TO ADD ONE
                  </button>
                )}
              </motion.div>
            )}

            {filtered.map((biz, idx) => (
              <motion.div
                key={biz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <BusinessCard biz={biz} getCategoryEmoji={getCategoryEmoji} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Business CTA */}
      {!loading && user && (
        <div className="mt-8 px-5">
          <div
            onClick={() => router.push('/businesses/add')}
            className="bg-gradient-to-br from-[var(--surface2)] to-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] p-5 flex items-center gap-4 cursor-pointer hover:border-[var(--border2)] transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-[14px] bg-[rgba(232,137,42,0.1)] border border-[rgba(232,137,42,0.2)] flex items-center justify-center text-2xl">
              +
            </div>
            <div>
              <div className="text-[14px] font-bold text-[var(--text)]">List Your Business</div>
              <div className="text-[12px] text-[var(--text3)]">
                Connect with the Gujarati community
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessCard({
  biz,
  getCategoryEmoji,
}: {
  biz: Business;
  getCategoryEmoji: (c: string | null) => string;
}) {
  const emoji = getCategoryEmoji(biz.category);

  return (
    <div className="biz-card">
      {/* Logo / Image */}
      <div className="w-14 h-14 rounded-[14px] bg-[var(--surface2)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0">
        {biz.image_url ? (
          <img src={biz.image_url} alt={biz.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="text-[14px] font-bold text-[var(--text)] truncate">{biz.name}</div>
            {biz.category && (
              <div className="text-[11px] font-semibold text-[var(--saffron)] uppercase tracking-[0.06em]">
                {biz.category}
              </div>
            )}
          </div>
        </div>

        {biz.description && (
          <p className="text-[12px] text-[var(--text2)] line-clamp-2 mb-2 leading-relaxed">
            {biz.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {biz.city && (
            <div className="flex items-center gap-1 text-[11px] text-[var(--text3)]">
              <MapPin size={10} />
              <span>
                {biz.city}
                {biz.country ? `, ${biz.country}` : ''}
              </span>
            </div>
          )}
          {biz.website && (
            <a
              href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-[var(--teal-light)] hover:underline"
            >
              <Globe size={10} />
              <span className="truncate max-w-[100px]">
                {biz.website.replace(/^https?:\/\//, '')}
              </span>
            </a>
          )}
          {biz.phone && (
            <a
              href={`tel:${biz.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-[var(--teal-light)]"
            >
              <Phone size={10} />
              <span>{biz.phone}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
