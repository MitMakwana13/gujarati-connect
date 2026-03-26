'use client';

export default function Header() {
  return (
    <div className="flex flex-col gap-4">
      {/* Status bar (mockup style) */}
      <div className="h-[44px] px-7 pt-3.5 flex items-center justify-between text-xs font-semibold text-[var(--text)]">
        <span className="tracking-wide">9:41</span>
        <div className="flex gap-1.5 items-center">
          <span>▂▄▆</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>

      {/* App header */}
      <div className="px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--saffron)] to-[#c46c10] rounded-xl flex items-center justify-center text-xl shadow-[0_4px_16px_rgba(232,137,42,0.3)]">
            🪔
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[var(--text)] leading-none font-serif">
              GujaratiConnect
            </h1>
            <p className="text-[10px] text-[var(--text2)] font-normal tracking-wider mt-0.5">
              Connecting Gujaratis Worldwide
            </p>
          </div>
        </div>
        <button className="w-9 h-9 bg-[var(--surface2)] border border-[var(--border)] rounded-full flex items-center justify-center relative hover:bg-[var(--surface3)] transition-colors">
          <span>🔔</span>
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--saffron)] rounded-full border-2 border-[var(--bg)]" />
        </button>
      </div>

      {/* Search */}
      <div className="px-5">
        <div className="glass-input flex items-center gap-2.5 h-[46px] px-4">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Search by city, name, or interest..." 
            className="bg-transparent border-none outline-none text-sm w-full h-full text-[var(--text)] placeholder:text-[var(--text3)]"
          />
        </div>
      </div>
    </div>
  );
}
