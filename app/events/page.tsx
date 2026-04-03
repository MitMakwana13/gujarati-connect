'use client';

import { motion } from 'framer-motion';

const EVENTS = [
  {
    id: 1,
    title: 'Navratri Grand Celebration 2025',
    date: 'OCT 03',
    location: 'Wembley Stadium, London',
    community: 'UK Gujarati Samaj',
    image: 'https://images.unsplash.com/photo-1514525253361-bee24388c97e?auto=format&fit=crop&q=80&w=400',
    attendees: 1200,
    status: 'RSVP OPEN'
  },
  {
    id: 2,
    title: 'Global Gujarati Business Summit',
    date: 'NOV 15',
    location: 'Gift City, Gandhinagar',
    community: 'Entrepreneurs Network',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400',
    attendees: 450,
    status: 'LIMITED SLOTS'
  },
  {
    id: 3,
    title: 'Traditional Food Festival',
    date: 'DEC 12',
    location: 'Edison, New Jersey',
    community: 'Jersey Gujjus',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
    attendees: 800,
    status: 'FREE ENTRY'
  }
];

export default function EventsPage() {
  return (
    <div className="pb-12">
      <div className="flex items-center justify-between px-5 mb-5 mt-2">
        <div className="sec-title !mb-0">Upcoming Events</div>
        <div className="text-[11px] font-bold text-[var(--saffron)] cursor-pointer">MY TICKETS</div>
      </div>

      <div className="px-5 space-y-5">
        {EVENTS.map((event, idx) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r3)] overflow-hidden group shadow-xl"
          >
            <div className="relative h-[160px]">
              <img src={event.image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-[14px] p-2 flex flex-col items-center justify-center min-w-[54px] shadow-lg">
                <span className="text-[10px] font-bold text-[var(--saffron)] leading-none mb-1">{event.date.split(' ')[0]}</span>
                <span className="text-[18px] font-bold text-[var(--bg)] leading-none">{event.date.split(' ')[1]}</span>
              </div>
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
                <span className="text-[10px] font-bold text-white tracking-widest">{event.status}</span>
              </div>
            </div>

            <div className="p-5">
              <div className="text-[11px] font-bold text-[var(--saffron)] uppercase tracking-widest mb-1.5">{event.community}</div>
              <h3 className="text-[18px] font-bold text-[var(--text)] font-serif leading-tight mb-3">{event.title}</h3>
              
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-[var(--text3)] flex items-center gap-1.5">
                  <span>📍</span>
                  <span className="truncate max-w-[140px]">{event.location}</span>
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--surface)] bg-[var(--surface2)] flex items-center justify-center text-[8px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--surface)] bg-[var(--saffron)] flex items-center justify-center text-[8px] font-bold text-white">
                    +{event.attendees - 3}
                  </div>
                </div>
              </div>

              <button className="w-full h-[44px] bg-[var(--surface2)] border border-[var(--border)] rounded-[14px] mt-5 text-[12px] font-bold text-[var(--text)] hover:bg-[var(--saffron)] hover:border-[var(--saffron)] hover:text-white transition-all">
                VIEW DETAILS
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 px-5">
        <div className="bg-gradient-to-br from-[var(--teal)] to-[var(--teal-deep)] rounded-[var(--r2)] p-6 text-center shadow-lg shadow-[rgba(26,174,163,0.2)]">
          <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">Host your own</div>
          <h4 className="text-[18px] font-bold text-white font-serif mb-4">Create a Community Event</h4>
          <button className="bg-white text-[var(--teal-deep)] px-6 py-2.5 rounded-full text-[12px] font-bold shadow-xl">
            GET STARTED
          </button>
        </div>
      </div>
    </div>
  );
}
