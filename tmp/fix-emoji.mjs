import { readFileSync, writeFileSync } from 'fs';

const f = 'apps/web/src/app/feed/page.tsx';
const s = readFileSync(f, 'utf8');

// The file suffered UTF-8 → CP-1252 → UTF-8 double-encoding.
// To reverse: map each char back to its CP-1252 byte, then decode as UTF-8.
// CP-1252 differs from Latin-1 only in 0x80–0x9F:
const cp1252Reverse = new Map([
  [0x20AC, 0x80], // €
  [0x201A, 0x82], // ‚
  [0x0192, 0x83], // ƒ
  [0x201E, 0x84], // „
  [0x2026, 0x85], // …
  [0x2020, 0x86], // †
  [0x2021, 0x87], // ‡
  [0x02C6, 0x88], // ˆ
  [0x2030, 0x89], // ‰
  [0x0160, 0x8A], // Š
  [0x2039, 0x8B], // ‹
  [0x0152, 0x8C], // Œ
  [0x017D, 0x8E], // Ž
  [0x2018, 0x91], // '
  [0x2019, 0x92], // '
  [0x201C, 0x93], // "
  [0x201D, 0x94], // "
  [0x2022, 0x95], // •
  [0x2013, 0x96], // –
  [0x2014, 0x97], // —
  [0x02DC, 0x98], // ˜
  [0x2122, 0x99], // ™
  [0x0161, 0x9A], // š
  [0x203A, 0x9B], // ›
  [0x0153, 0x9C], // œ
  [0x017E, 0x9E], // ž
  [0x0178, 0x9F], // Ÿ
]);

// Convert each char to its CP-1252 byte value
const bytes = [];
for (const ch of s) {
  const cp = ch.codePointAt(0);
  if (cp <= 0xFF) {
    bytes.push(cp); // Latin-1 range maps directly
  } else if (cp1252Reverse.has(cp)) {
    bytes.push(cp1252Reverse.get(cp)); // CP-1252 special range
  } else {
    // Not a CP-1252 char — this is genuinely multi-byte (e.g. already-correct text).
    // Encode it as UTF-8 bytes to preserve it.
    const encoded = Buffer.from(ch, 'utf8');
    for (const b of encoded) bytes.push(b);
  }
}

const fixed = Buffer.from(bytes).toString('utf8');

// Verify
if (!fixed.includes('FeedPage')) {
  console.error('ERROR: lost FeedPage marker');
  process.exit(1);
}

const mojiBefore = (s.match(/\u00f0\u0178/g) || []).length;
const mojiAfter = (fixed.match(/\u00f0\u0178/g) || []).length;
console.log(`Mojibake "ðŸ" sequences: before=${mojiBefore}, after=${mojiAfter}`);
console.log(`File size: before=${Buffer.byteLength(s)}, after=${Buffer.byteLength(fixed)}`);

// Show a sample line to verify
const lines = fixed.split('\n');
console.log('Sample SIDEBAR_LINKS:', lines.find(l => l.includes("'Home Feed'")));

writeFileSync(f, fixed, 'utf8');
console.log('Written successfully');
