import React, { useEffect } from "react";

/**
 * CarryMatch Logistics (CML) – Premium/Dramatic Hero Background
 * -------------------------------------------------------------
 * Background‑only (no text). Cinematic logistics vibe:
 *  • Deep midnight gradient with neon brand glows
 *  • Hex/dot micro‑pattern
 *  • Moving route arcs with traveling parcel lights
 *  • Soft aurora beams + diagonal light streaks
 *  • Pulsing route nodes + right‑side radar module
 * Pure React + CSS/SVG, low‑data, honors prefers‑reduced‑motion.
 *
 * Exports:
 *  1) default preview component – click Preview
 *  2) CmlHeroBackground({ style }) – reusable background layer
 */
export default function CmlHeroBackgroundPreview(){
  // smoke tests (compile‑time issues & runtime sanity)
  useEffect(()=>{
    try{
      const grad   = document.querySelector('.cml-grad');
      const routes = document.querySelector('.cml-routes');
      const nodes  = document.querySelectorAll('.cml-node');
      const radar  = document.querySelector('.cml-radar');
      console.assert(!!grad,   'Gradient layer present');
      console.assert(!!routes, 'Routes SVG present');
      console.assert(nodes.length >= 3, 'At least three route nodes');
      console.assert(!!radar,  'Right‑side radar present');
    }catch(e){ /* no‑op */ }
  },[]);

  return (
    <section className="cml-wrap">
      <StyleTag/>
      <CmlHeroBackground style={{ position:'absolute', inset:0 }} />
      {/* frame only for preview */}
      <div className="cml-frame"/>
    </section>
  );
}

export function CmlHeroBackground({ style }){
  return (
    <div style={style} aria-hidden>
      <StyleTag />
      {/* base */}
      <div className="cml-grad"/>
      <div className="cml-dots"/>

      {/* aurora sweeps */}
      <div className="cml-aurora a1"/>
      <div className="cml-aurora a2"/>

      {/* diagonal beams */}
      <div className="cml-beam left"/>
      <div className="cml-beam right"/>

      {/* RIGHT-SIDE ANIMATION MODULE (radar + streaks) */}
      <div className="cml-rightfx">
        <div className="cml-radar">
          <div className="cml-rings"/>
          <div className="cml-sweep"/>
          <span className="cml-rping r1"/>
          <span className="cml-rping r2"/>
        </div>
        <div className="cml-right-streaks"/>
      </div>

      {/* route nodes */}
      <div className="cml-node" style={{ left:'12%', top:'58%' }} />
      <div className="cml-node" style={{ left:'42%', top:'36%' }} />
      <div className="cml-node" style={{ left:'74%', top:'48%' }} />

      {/* moving arcs */}
      <RoutesSvg/>
    </div>
  );
}

function RoutesSvg(){
  return (
    <svg className="cml-routes" viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden>
      <defs>
        {/* stroke gradient fades to transparent on the far right */}
        <linearGradient id="cml-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#20D3C2" stopOpacity="1"/>
          <stop offset="60%" stopColor="#7CFF00" stopOpacity=".95"/>
          <stop offset="100%" stopColor="#7CFF00" stopOpacity="0"/>
        </linearGradient>
        {/* right‑edge fade mask so lines start on left and disappear at far right */}
        <linearGradient id="cml-fade-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
          <stop offset="80%"  stopColor="#ffffff" stopOpacity="1"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
        <mask id="cml-mask-right">
          <rect width="100%" height="100%" fill="url(#cml-fade-right)" />
        </mask>
      </defs>

      {/* group masked to fade out on the right */}
      <g mask="url(#cml-mask-right)">
        {/* high arc (start from left) */}
        <path id="arc1" d="M -8 46 C 16 30, 44 26, 78 34 S 116 44, 132 40" className="arc fast" />
        {/* mid arc */}
        <path id="arc2" d="M -10 40 C 12 28, 42 30, 72 38 S 120 50, 136 52" className="arc" />
        {/* low arc */}
        <path id="arc3" d="M -12 50 C 10 44, 42 42, 70 46 S 118 56, 138 58" className="arc slow" />

        {/* traveling parcel lights (fade on right via mask) */}
        <circle r="1.2" className="parcel p1"><animateMotion dur="8s"  repeatCount="indefinite" path="M -8 46 C 16 30, 44 26, 78 34 S 116 44, 132 40"/></circle>
        <circle r="1.2" className="parcel p2"><animateMotion dur="9.5s" repeatCount="indefinite" path="M -10 40 C 12 28, 42 30, 72 38 S 120 50, 136 52"/></circle>
        <circle r="1.2" className="parcel p3"><animateMotion dur="11s" repeatCount="indefinite" path="M -12 50 C 10 44, 42 42, 70 46 S 118 56, 138 58"/></circle>
      </g>
    </svg>
  );
}

function StyleTag(){
  return (
    <style>{`
      :root{
        --bg1:#0b0f2b; --bg2:#161c49; --bg3:#1b1f66; /* midnight purple/indigo */
        --brand:#7CFF00; --cyan:#66E3FF;
      }
      *{box-sizing:border-box}

      .cml-wrap{position:relative;height:60vh;min-height:380px;overflow:hidden;background:#0f1234}
      .cml-frame{position:absolute;inset:0;border:1px solid rgba(255,255,255,.06);pointer-events:none}

      .cml-grad{position:absolute;inset:0;background:
        radial-gradient(140% 160% at 80% -10%, #2a2b87 0%, var(--bg3) 40%, var(--bg2) 65%, var(--bg1) 100%),
        linear-gradient(120deg, #171a56, #1a1e60);
      }

      /* dot/hex vibe */
      .cml-dots{position:absolute;inset:0;background-image:radial-gradient(#ffffff10 1px, transparent 1px);background-size:22px 22px;opacity:.25;animation:cml-dots 36s linear infinite;mask-image:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%);-webkit-mask-image:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)}
      @keyframes cml-dots{to{background-position:240px 140px}}

      /* aurora sweeps */
      .cml-aurora{position:absolute;left:-20%;right:-20%;height:30%;border-radius:48px;filter:blur(30px);opacity:.55}
      .cml-aurora.a1{top:8%;background:linear-gradient(90deg, transparent, rgba(32,211,194,.18), rgba(124,255,0,.18), transparent);animation:cml-aur1 14s ease-in-out infinite}
      .cml-aurora.a2{top:26%;background:linear-gradient(90deg, transparent, rgba(102,227,255,.16), rgba(32,211,194,.14), transparent);animation:cml-aur2 16s ease-in-out infinite}
      @keyframes cml-aur1{0%{transform:translateX(-6%)}50%{transform:translateX(6%)}100%{transform:translateX(-6%)}}
      @keyframes cml-aur2{0%{transform:translateX(5%)}50%{transform:translateX(-4%)}100%{transform:translateX(5%)}}

      /* diagonal beams */
      .cml-beam{position:absolute;top:10%;width:48%;height:22%;border-radius:32px;filter:blur(20px);opacity:.45;background:linear-gradient(90deg, transparent, rgba(124,255,0,.18), transparent)}
      .cml-beam.left{left:-12%;transform:rotate(-14deg);animation:cml-beamL 12s ease-in-out infinite}
      .cml-beam.right{right:-12%;transform:rotate(12deg);animation:cml-beamR 12s ease-in-out infinite}
      @keyframes cml-beamL{0%,100%{transform:translateX(0) rotate(-14deg)}50%{transform:translateX(3%) rotate(-14deg)}}
      @keyframes cml-beamR{0%,100%{transform:translateX(0) rotate(12deg)}50%{transform:translateX(-3%) rotate(12deg)}}

      /* nodes */
      .cml-node{position:absolute;width:12px;height:12px;border-radius:9999px;background:var(--brand);box-shadow:0 0 14px var(--brand);} 
      .cml-node::after{content:"";position:absolute;left:50%;top:50%;width:28px;height:28px;border:1px solid rgba(124,255,0,.55);border-radius:9999px;transform:translate(-50%,-50%) scale(.6);animation:cml-pulse 2.4s ease-out infinite}
      @keyframes cml-pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.7}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}

      /* routes */
      .cml-routes{position:absolute;left:0;right:0;bottom:12%;height:48%;opacity:.95}
      .arc{fill:none;stroke:url(#cml-arc);stroke-width:1.2;stroke-linecap:round;stroke-dasharray:220;animation:cml-arc 9s linear infinite}
      .arc.slow{animation-duration:12s;opacity:.8}
      .arc.fast{animation-duration:7s;opacity:.95}
      @keyframes cml-arc{0%{stroke-dashoffset:220}100%{stroke-dashoffset:-220}}
      .parcel{fill:#fff;filter:drop-shadow(0 0 4px rgba(124,255,0,.9));opacity:.95}

      /* RIGHT-SIDE FX (radar + streaks) */
      .cml-rightfx{position:absolute;right:4%;top:12%;width:min(30vmin,340px);height:min(30vmin,340px);pointer-events:none}
      .cml-radar{position:absolute;inset:0;border-radius:9999px;}
      .cml-rings{position:absolute;inset:0;border-radius:9999px;background:repeating-radial-gradient(circle at 50% 50%, rgba(124,255,0,.14) 0px, rgba(124,255,0,.14) 2px, transparent 2px, transparent 10px);opacity:.5}
      .cml-sweep{position:absolute;inset:-6%;border-radius:9999px;background:conic-gradient(from 0deg, rgba(102,227,255,0) 0deg, rgba(102,227,255,.22) 28deg, rgba(102,227,255,0) 70deg);mix-blend-mode:screen;animation:cml-rotate 9s linear infinite;filter:blur(6px)}
      @keyframes cml-rotate{to{transform:rotate(360deg)}}
      .cml-rping{position:absolute;width:8px;height:8px;border-radius:9999px;background:var(--brand);box-shadow:0 0 10px var(--brand)}
      .cml-rping::after{content:"";position:absolute;left:50%;top:50%;width:22px;height:22px;border:1px solid rgba(124,255,0,.5);border-radius:9999px;transform:translate(-50%,-50%) scale(.6);animation:cml-pulse 2s ease-out infinite}
      .cml-rping.r1{left:62%;top:44%;transform:translate(-50%,-50%)}
      .cml-rping.r2{left:38%;top:62%;transform:translate(-50%,-50%)}

      .cml-right-streaks{position:absolute;right:-12%;top:-20%;width:48%;height:140%;background:linear-gradient(90deg, transparent, rgba(124,255,0,.16), rgba(102,227,255,.12), transparent);filter:blur(18px);opacity:.4;transform:rotate(14deg);animation:cml-streak 14s ease-in-out infinite}
      @keyframes cml-streak{0%,100%{transform:translateX(0) rotate(14deg)}50%{transform:translateX(-3%) rotate(14deg)}}

      @media (prefers-reduced-motion: reduce){
        .cml-dots,.cml-aurora,.cml-beam,.arc,.parcel,.cml-node::after,.cml-sweep,.cml-right-streaks{animation:none}
      }
    `}</style>
  );
}