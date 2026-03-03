import React, { useId, useMemo } from "react";

/**
 * AnimatedDigit – recreates the moving purple stripe animation inside a digit.
 *
 * Props
 * - digit: string | number – character(s) to mask (default: "1")
 * - className: string – size and container styles (Tailwind) (default gives a nice card)
 * - speedSec: number – scroll speed in seconds (default: 7)
 * - direction: 'up' | 'down' – stripe travel direction (default: 'up')
 * - seed: number – deterministic stripe layout seed (default: 11)
 * - sheen: boolean – glossy overlay (default: true)
 *
 * Example usage:
 *   <AnimatedDigit className="w-[320px] h-[460px]" digit="1" />
 *   <AnimatedDigit className="w-80 h-[28rem]" digit="5" speedSec={10} direction="down" />
 */
export default function AnimatedDigit({
  digit = "1",
  className = "w-full min-h-[60vh] bg-white rounded-2xl grid place-items-center shadow-sm",
  speedSec = 7,
  direction = "up",
  seed = 11,
  sheen = true,
}) {
  const rawId = useId();
  const uid = useMemo(() => `_${String(rawId).replace(/[:]/g, "")}`, [rawId]);

  const viewW = 800;
  const viewH = 1000;
  const bars = useMemo(() => generateBars(viewW, viewH, seed, uid), [seed, uid]);

  const animName = `scroll${uid}`;
  const dirTo = direction === "up" ? "-50%" : "50%";

  return (
    <div className={`relative p-6 ${className}`}>
      <style>{`
        @keyframes ${animName} {
          from { transform: translateY(0); }
          to   { transform: translateY(${dirTo}); }
        }
        .scroller${uid} { animation: ${animName} ${speedSec}s linear infinite; will-change: transform; }
        @keyframes sheen${uid} {
          0%,100%{ transform: translateY(0); opacity:.28; }
          50%    { transform: translateY(-6%); opacity:.4; }
        }
        .sheen${uid} { animation: sheen${uid} ${speedSec * 2}s ease-in-out infinite; mix-blend-mode: screen; }
        @media (prefers-reduced-motion: reduce){
          .scroller${uid}, .sheen${uid} { animation: none; }
        }
      `}</style>

      <div className="relative w-[min(72vmin,520px)] aspect-[3/4]">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-full" role="img" aria-label={`Animated number ${digit} with moving purple stripes`}>
          <defs>
            <linearGradient id={`barGradient${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0b0b3b" />
              <stop offset="28%"  stopColor="#1b1361" />
              <stop offset="55%"  stopColor="#3a218f" />
              <stop offset="78%"  stopColor="#6e3ff0" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id={`barCore${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%"  stopColor="#ffffff" stopOpacity=".35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <mask id={`digitMask${uid}`}>
              <rect width="100%" height="100%" fill="black" />
              <text x="50%" y="80%" textAnchor="middle" fill="white" style={{ font: "900 800px/1 'Poppins', system-ui, sans-serif" }}>
                {String(digit)}
              </text>
            </mask>
          </defs>

          <g mask={`url(#digitMask${uid})`}>
            <g className={`scroller${uid}`}>
              <g>{bars}</g>
              {/* duplicate immediately below for seamless loop */}
              <g transform={`translate(0, ${viewH})`}>{bars}</g>
            </g>
            {sheen && (
              <rect className={`sheen${uid}`} x="0" y="0" width={viewW} height={viewH} fill={`url(#barCore${uid})`} opacity={0.35} />
            )}
          </g>

          {/* faint drop shadow to make the mask edges pop on white */}
          <text x="50%" y="80%" textAnchor="middle" fill="rgba(0,0,0,0.04)" style={{ font: "900 800px/1 'Poppins', system-ui, sans-serif", filter: "blur(1px)" }} transform="translate(0,2)">
            {String(digit)}
          </text>
        </svg>
      </div>
    </div>
  );
}

function generateBars(W, H, seed, uid) {
  const rng = mulberry32(seed);
  const nodes = [];
  let x = -10;
  while (x < W + 10) {
    const w = Math.max(2, Math.floor(rng() * 12) + 2); // 2–14 px
    const gap = Math.floor(rng() * 10); // 0–10 px gap
    const jitter = rng() * 4 - 2; // slight horizontal wobble
    const xx = x + jitter;

    nodes.push(
      <rect key={`b-${uid}-${xx.toFixed(2)}-${nodes.length}`} x={xx} y={0} width={w} height={H} fill={`url(#barGradient${uid})`} />
    );

    if (rng() > 0.6) {
      const coreW = Math.max(1, Math.floor(w * 0.35));
      nodes.push(
        <rect
          key={`c-${uid}-${xx.toFixed(2)}-${nodes.length}`}
          x={xx + Math.floor((w - coreW) / 2)}
          y={0}
          width={coreW}
          height={H}
          fill={`url(#barCore${uid})`}
          opacity={0.7}
        />
      );
    }

    x += w + gap;
  }
  return nodes;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}