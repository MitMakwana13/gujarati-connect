'use client';

export default function Header() {
  return (
    <div className="flex flex-col gap-0">
      {/* Status bar (mockup style) */}
      <div className="h-[54px] px-8 pt-4 flex items-center justify-between text-xs font-semibold text-[var(--text)]">
        <span>9:41</span>
        <div className="flex gap-1.5 items-center text-[11px]">
          <span>▂▄▆█</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>

      {/* App header */}
      <div className="px-5 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] bg-gradient-to-br from-[var(--saffron)] via-[var(--saffron-dark)] to-[var(--saffron-deep)] rounded-[13px] flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(232,137,42,0.35)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <span className="relative z-10">🪔</span>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[19px] font-bold text-[var(--text)] leading-none font-serif tracking-tight">
              GujaratiConnect
            </h1>
            <p className="text-[10px] text-[var(--text3)] font-normal tracking-[0.06em] mt-0.5 uppercase">
              Worldwide Network
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-[38px] h-[38px] bg-[var(--surface2)] border border-[var(--border)] rounded-[12px] flex items-center justify-center text-[15px] hover:bg-[var(--surface3)] transition-all">
            💬
          </button>
          <button className="w-[38px] h-[38px] bg-[var(--surface2)] border border-[var(--border)] rounded-[12px] flex items-center justify-center text-[15px] relative hover:bg-[var(--surface3)] transition-all">
            🔔
            <div className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-[var(--saffron)] rounded-full border-2 border-[var(--surface2)] animate-pulse" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3">
        <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-[13px] flex items-center gap-2.5 h-[44px] px-4 relative overflow-hidden group focus-within:border-[rgba(232,137,42,0.4)] transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(232,137,42,0.06)] via-transparent to-[rgba(26,174,163,0.04)] opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <span className="text-[15px] relative z-10 text-[var(--text3)]">🔍</span>
          <input 
            type="text" 
            placeholder="Search people, communities, cities…" 
            className="bg-transparent border-none outline-none text-[13px] w-full h-full text-[var(--text)] placeholder:text-[var(--text3)] relative z-10"
          />
        </div>
      </div>
    </div>
  );
}
