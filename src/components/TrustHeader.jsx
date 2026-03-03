import React, { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * CarryMatch Trust Header Animation
 * ------------------------------------------------------------
 * Drop this component at the top of your Testimonials section.
 * It renders the heading and a tasteful animated background
 * (twinkling stars + soft gradient sweep) that fits dark/indigo UI.
 *
 * Tailwind-first, Framer Motion for animation.
 * Accessible: respects prefers-reduced-motion.
 *
 * Usage:
 *   <TrustHeader className="py-24" />
 *   <TrustHeader titleTop="Trusted by travelers." titleBottom="Loved by senders." />
 */

export default function TrustHeader({
  titleTop = "Trusted by travelers.",
  titleBottom = "Loved by senders.",
  className = "py-20",
  seed = 17,
  density = 26, // number of floating stars
  accentFrom = "#6e3ff0",
  accentTo = "#8a6cff",
}) {
  const id = useId().replace(/[:]/g, "");
  const prefersReduced = useReducedMotion();

  const stars = useMemo(() => makeStars(density, seed), [density, seed]);

  return (
    <section className={`relative isolate text-center ${className}`}>
      {/* Decorative background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-30%] h-[60vmin] w-[85vmin] -translate-x-1/2 rounded-full blur-3xl"
             style={{ background: `radial-gradient(ellipse at center, ${accentFrom}22 0%, transparent 70%)` }} />
        <div className="absolute right-[10%] bottom-[-20%] h-[50vmin] w-[60vmin] rounded-full blur-3xl"
             style={{ background: `radial-gradient(ellipse at center, ${accentTo}22 0%, transparent 70%)` }} />

        {/* Soft sweeping sheen behind the title */}
        <motion.div
          className="absolute left-[-20%] top-[25%] h-[40%] w-[140%] rounded-[32px] opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentFrom}, ${accentTo}, transparent)`,
            filter: "blur(28px)",
          }}
          animate={prefersReduced ? undefined : { x: ["-10%", "10%", "-10%"], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Twinkling stars */}
        {stars.map((s, i) => (
          <TwinkleStar key={`${id}-${i}`} {...s} reduced={prefersReduced} from={accentFrom} to={accentTo} />
        ))}
      </div>

      {/* Heading */}
      <h2 className="mx-auto max-w-4xl px-4 font-extrabold tracking-tight text-white">
        <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
          {titleTop}
        </span>
        <span className="relative mt-3 inline-block bg-gradient-to-r from-indigo-300 via-white to-indigo-300 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
          {titleBottom}
          {/* Animated underline */}
          <motion.span
            aria-hidden
            className="block h-[3px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${accentFrom}, ${accentTo}, transparent)`,
            }}
            animate={prefersReduced ? undefined : { backgroundPositionX: ["0%", "200%"], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
          />
        </span>
      </h2>

      {/* Subtle 5‑star badge under the heading (animated glow) */}
      <div className="mt-6 flex items-center justify-center gap-2 text-indigo-100/90">
        <AnimatedStars from={accentFrom} to={accentTo} reduced={prefersReduced} />
        <span className="text-sm/6 opacity-80">5.0 average from real users</span>
      </div>
    </section>
  );
}

// ---------- Twinkling star particle ----------
function TwinkleStar({ x, y, scale, rotate, delay, duration, reduced, from, to }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: 14 * scale, height: 14 * scale }}
      initial={{ opacity: 0.2, rotate, scale }}
      animate={
        reduced
          ? { opacity: 0.35 }
          : {
              opacity: [0.25, 0.9, 0.25],
              rotate: [rotate, rotate + 20, rotate],
              y: [0, -6 * scale, 0],
              scale: [scale, scale * 1.15, scale],
            }
      }
      transition={{ delay, duration, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={to} stopOpacity="1" />
          <stop offset="100%" stopColor={from} stopOpacity="0.15" />
        </radialGradient>
      </defs>
      <path
        d="M12 2l2.6 5.9 6.4.6-4.9 4.2 1.5 6.3L12 16.9 6.4 19l1.5-6.3-4.9-4.2 6.4-.6L12 2z"
        fill="url(#g)"
        opacity={0.9}
      />
    </motion.svg>
  );
}

// ---------- Animated 5‑star row ----------
function AnimatedStars({ from, to, reduced }) {
  const stars = new Array(5).fill(0);
  return (
    <div className="inline-flex items-center gap-1">
      {stars.map((_, idx) => (
        <motion.svg
          key={idx}
          viewBox="0 0 24 24"
          className="h-5 w-5"
          initial={{ scale: 0.9, opacity: 0.85 }}
          animate={
            reduced
              ? { opacity: 0.95 }
              : { scale: [0.92, 1.05, 0.92], opacity: [0.8, 1, 0.8] }
          }
          transition={{ duration: 1.2, delay: idx * 0.08, repeat: Infinity, ease: "easeInOut" }}
        >
          <defs>
            <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <path d="M12 2l2.6 5.9 6.4.6-4.9 4.2 1.5 6.3L12 16.9 6.4 19l1.5-6.3-4.9-4.2 6.4-.6L12 2z" fill={`url(#grad-${idx})`} />
        </motion.svg>
      ))}
    </div>
  );
}

// ---------- Helpers ----------
function makeStars(count, seed) {
  const r = mulberry32(seed);
  const out = [];

  for (let i = 0; i < count; i++) {
    // Keep the center vertical area lighter so text remains crisp
    let x = r() * 100;
    if (x > 38 && x < 62) x = x < 50 ? x - 12 : x + 12; // push away from center

    const y = 10 + r() * 60; // avoid extreme top/bottom
    const scale = 0.8 + r() * 1.6; // 0.8..2.4
    const rotate = -10 + r() * 20;
    const delay = r() * 3.5;
    const duration = 2.8 + r() * 3.2; // 2.8..6s
    out.push({ x, y, scale, rotate, delay, duration });
  }
  return out;
}

function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}