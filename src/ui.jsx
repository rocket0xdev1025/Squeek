import { useEffect, useState } from "react";

export function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <svg className="mark-hamster" viewBox="0 0 16 16">
        <rect width="16" height="16" fill="#f7f1e4" />
        <rect x="2" y="2" width="3" height="3" fill="#e0a060" />
        <rect x="11" y="2" width="3" height="3" fill="#e0a060" />
        <rect x="3" y="4" width="10" height="8" fill="#f2c230" />
        <rect x="4" y="7" width="2" height="2" fill="#1a1a20" />
        <rect x="10" y="7" width="2" height="2" fill="#1a1a20" />
        <rect x="7" y="9" width="2" height="2" fill="#c97b6a" />
        <rect x="5" y="12" width="6" height="2" fill="#e8b04a" />
      </svg>
      <svg className="mark-tile" viewBox="0 0 16 16">
        <rect width="16" height="16" fill="#5b7cfa" />
        <rect x="2" y="2" width="5" height="5" fill="#edf1ff" />
        <rect x="9" y="2" width="5" height="5" fill="#c5d0ff" />
        <rect x="2" y="9" width="5" height="5" fill="#c5d0ff" />
        <rect x="9" y="9" width="5" height="5" fill="#edf1ff" />
      </svg>
    </span>
  );
}

export function Help({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="help">
      <button
        type="button"
        className="help-btn"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      {open ? (
        <span className="help-pop" role="note">
          {children}
        </span>
      ) : null}
    </span>
  );
}

export function Panel({ className = "", children, label }) {
  return (
    <section className={`panel ${className}`} aria-label={label}>
      {children}
    </section>
  );
}

export function RangeTabs({ value, onChange, label }) {
  return (
    <div className="range-tabs" role="group" aria-label={label}>
      {["now", "24h", "7d", "30d"].map((range) => (
        <button
          key={range}
          type="button"
          className={value === range ? "on" : ""}
          aria-pressed={value === range}
          onClick={() => onChange(range)}
        >
          {range.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
};

export function Lettering() {
  const rows = ["SQUEEK", "CHAIN"];
  return (
    <div className="lettering" aria-hidden="true">
      {rows.map((word, rowIndex) => (
        <div className={`letter-row ${rowIndex ? "blue" : "gold"}`} key={word}>
          {[...word].map((char, index) => (
            <span className="glyph" key={`${word}-${index}`}>
              {(GLYPHS[char] || []).map((line, y) => (
                <span className="glyph-line" key={y}>
                  {[...line].map((bit, x) => (
                    <i key={x} className={bit === "1" ? "on" : ""} />
                  ))}
                </span>
              ))}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Cube({ percent = 0 }) {
  const p = Math.max(0, Math.min(100, percent || 0));
  return (
    <svg className="cube" viewBox="0 0 120 110" aria-hidden="true">
      <polygon points="60,18 100,38 60,58 20,38" fill="#9eb0ff" />
      <polygon points="20,38 60,58 60,98 20,78" fill="#4460cf" />
      <polygon points="60,58 100,38 100,78 60,98" fill="#2f4499" />
      <polygon points="78,28 96,37 78,46 60,37" fill="#d7e0ff" />
      <polygon points="60,37 78,46 78,62 60,53" fill="#5b7cfa" />
      <polygon points="78,46 96,37 96,53 78,62" fill="#3451c4" />
      <clipPath id="cube-fill">
        <rect x="20" y={98 - p * 0.6} width="80" height={p * 0.6} />
      </clipPath>
    </svg>
  );
}

export function OracleHamster() {
  return (
    <svg className="oracle-art" viewBox="0 0 120 90" aria-hidden="true">
      <ellipse cx="60" cy="74" rx="34" ry="10" fill="#f3d5dc" />
      <rect x="34" y="28" width="52" height="40" fill="#f7c3d0" />
      <rect x="28" y="18" width="16" height="16" fill="#f4a8ba" />
      <rect x="76" y="18" width="16" height="16" fill="#f4a8ba" />
      <rect x="32" y="22" width="8" height="8" fill="#fff6f8" />
      <rect x="80" y="22" width="8" height="8" fill="#fff6f8" />
      <rect x="46" y="42" width="6" height="6" fill="#1a1a20" />
      <rect x="68" y="42" width="6" height="6" fill="#1a1a20" />
      <rect x="56" y="52" width="8" height="5" fill="#c45b78" />
      <rect x="40" y="64" width="40" height="8" fill="#fbe6ee" />
    </svg>
  );
}

export function Hen() {
  return (
    <svg className="hen" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="30" y="6" width="6" height="8" fill="#c33346" />
      <rect x="24" y="12" width="18" height="8" fill="#2a2a33" />
      <rect x="16" y="20" width="30" height="22" fill="#1a1a20" />
      <rect x="12" y="28" width="8" height="10" fill="#1a1a20" />
      <rect x="20" y="26" width="4" height="4" fill="#f2f2f4" />
      <rect x="40" y="40" width="16" height="6" fill="#e8b04a" />
      <rect x="22" y="42" width="6" height="12" fill="#e8b04a" />
      <rect x="32" y="42" width="6" height="12" fill="#e8b04a" />
    </svg>
  );
}

export function Egg({ value = "0" }) {
  return (
    <span className="egg">
      <svg viewBox="0 0 40 48" aria-hidden="true">
        <ellipse cx="20" cy="26" rx="14" ry="18" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <b>{value}</b>
    </span>
  );
}

const HAMSTER = [
  "..111111..",
  ".11111111.",
  "1101101111",
  "1101101111",
  "1111111111",
  ".11111111.",
  "..111111..",
  "...1111...",
];

export function SleepingHamster() {
  return (
    <div className="sleep-hamster" aria-hidden="true">
      {HAMSTER.map((row, y) => (
        <div key={y}>
          {[...row].map((cell, x) => (
            <i key={x} className={cell === "1" ? "on" : cell === "0" ? "eye" : ""} />
          ))}
        </div>
      ))}
      <span className="zzz">z</span>
      <span className="zzz late">z</span>
    </div>
  );
}

export function SupplyEgg({ percent = 0 }) {
  const dots = [];
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 13; x += 1) {
      const nx = (x - 6) / 6.2;
      const ny = (y - 7.2) / 8.2;
      const egg = nx * nx + ny * ny * (y < 7 ? 1.15 : 0.82);
      if (egg > 1) continue;
      const fromBottom = (15 - y) / 15;
      dots.push({ x, y, on: fromBottom <= percent / 100 });
    }
  }
  return (
    <svg className="supply-egg" viewBox="0 0 130 160" aria-hidden="true">
      {dots.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={10 + dot.x * 9} cy={8 + dot.y * 9} r="2.2" className={dot.on ? "on" : ""} />
      ))}
    </svg>
  );
}

export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return now;
}
