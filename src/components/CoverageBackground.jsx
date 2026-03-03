import React, { useEffect } from "react";

/**
 * CML – Global Coverage Background (background‑only)
 * -------------------------------------------------
 * Subtle, premium animation for the "Global Coverage" section.
 * Pure React + CSS/SVG (no libs, no TypeScript). Low‑data.
 *
 * Visuals
 *  • Deep indigo → navy gradient
 *  • Micro‑dot diagonal grid
 *  • Left wireframe globe with lat/long lines
 *  • Soft aurora wash and diagonal beam
 *  • Route arcs from globe to the right with traveling lights
 *  • Honors prefers‑reduced‑motion
 *
 * Exports:
 *  1) default preview – click Preview
 *  2) CoverageBackground({ style }) – reusable background layer
 */
export default function CoverageBackgroundPreview(){
  useEffect(()=>{
    try{
      const globe  = document.querySelector('.cov-globe');
      const arcs   = document.querySelector('.cov-arcs');
      const dots   = document.querySelector('.cov-dots');
      console.assert(!!globe && !!arcs && !!dots, 'Background layers present');
    }catch(e){/* noop */}
  },[]);

  return (
    <section className="cov-wrap">
      <StyleTag/>
      <CoverageBackground style={{ position:'absolute', inset:0 }} />
      {/* frame only */}
      <div className="cov-frame"/>
    </section>
  );
}

export function CoverageBackground({ style }){
  return (
    <div style={style} aria-hidden>
      <StyleTag />
      <div className="cov-grad"/>
      <div className="cov-dots"/>
      <div className="cov-aurora"/>
      <div className="cov-beam"/>

      {/* right wireframe globe */}
      <GlobeSvg/>

      {/* arcs to right (masked fade near far right) */}
      <ArcsSvg/>
    </div>
  );
}

function GlobeSvg(){
  return (
    <svg className="cov-globe" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <linearGradient id="cov-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#66E3FF"/>
          <stop offset="100%" stopColor="#20D3C2"/>
        </linearGradient>
      </defs>
      <g transform="translate(100,100)">
        {/* latitude rings */}
        {[-70,-50,-30,-10,10,30,50,70].map((lat,i)=> (
          <ellipse key={i} rx={80*Math.cos(Math.abs(lat)*Math.PI/360)} ry={36*Math.cos(Math.abs(lat)*Math.PI/360)} cx={0} cy={(lat/90)*60}
            fill="none" stroke="url(#cov-stroke)" strokeOpacity={0.35} strokeWidth={0.8} />
        ))}
        {/* longitude rings */}
        {[...Array(10)].map((_,i)=> (
          <ellipse key={i} rx={80} ry={36} cx={0} cy={0} fill="none" stroke="url(#cov-stroke)" strokeOpacity={0.28} strokeWidth={0.8} transform={`rotate(${i*18})`} />
        ))}
      </g>
    </svg>
  );
}

function ArcsSvg(){
  return (
    <svg className="cov-arcs" viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="cov-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#20D3C2"/>
          <stop offset="65%" stopColor="#7CFF00"/>
          <stop offset="100%" stopColor="#7CFF00" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="cov-fade-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="1"/>
          <stop offset="80%" stopColor="#fff" stopOpacity="1"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <mask id="cov-mask-right"><rect width="100%" height="100%" fill="url(#cov-fade-right)"/></mask>
      </defs>

      <g mask="url(#cov-mask-right)">
        <path d="M 10 36 C 26 28, 48 28, 72 32 S 108 42, 130 40" className="arc"/>
        <path d="M 12 42 C 26 38, 50 36, 78 38 S 112 48, 132 52" className="arc slow"/>
        <path d="M 8 48 C 26 46, 54 44, 80 46 S 116 52, 136 56" className="arc slow2"/>

        {/* travelers */}
        <circle r="1.3" className="parcel p1"><animateMotion dur="9s" repeatCount="indefinite" path="M 10 36 C 26 28, 48 28, 72 32 S 108 42, 130 40"/></circle>
        <circle r="1.3" className="parcel p2"><animateMotion dur="10.5s" repeatCount="indefinite" path="M 12 42 C 26 38, 50 36, 78 38 S 112 48, 132 52"/></circle>
        <circle r="1.3" className="parcel p3"><animateMotion dur="12s" repeatCount="indefinite" path="M 8 48 C 26 46, 54 44, 80 46 S 116 52, 136 56"/></circle>
      </g>
    </svg>
  );
}

function StyleTag(){
  return (
    <style>{`
      :root{ --indigo:#0f1e4a; --navy:#0e1a3e; --brand:#7CFF00; }
      *{box-sizing:border-box}
      .cov-wrap{position:relative;height:60vh;min-height:420px;overflow:hidden;background:var(--navy)}
      .cov-frame{position:absolute;inset:0;border:1px solid rgba(255,255,255,.06);pointer-events:none}

      .cov-grad{position:absolute;inset:0;background:
        radial-gradient(140% 160% at 80% -10%, #23326e 0%, #1a2557 40%, #13204a 70%, #0d193c 100%),
        linear-gradient(120deg, #13265c, #0f214f);
      }
      .cov-dots{position:absolute;inset:0;background-image:radial-gradient(#ffffff10 1px, transparent 1px);background-size:18px 18px;opacity:.22;animation:cov-dots 36s linear infinite;mask-image:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%);-webkit-mask-image:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)}
      @keyframes cov-dots{to{background-position:220px 140px}}

      .cov-aurora{position:absolute;left:-20%;right:-20%;top:16%;height:36%;border-radius:44px;filter:blur(26px);opacity:.45;background:linear-gradient(90deg, transparent, rgba(102,227,255,.16), rgba(32,211,194,.14), transparent);animation:cov-aur 16s ease-in-out infinite}
      @keyframes cov-aur{0%{transform:translateX(-6%)}50%{transform:translateX(6%)}100%{transform:translateX(-6%)}}

      .cov-beam{position:absolute;left:-14%;top:-8%;width:60%;height:26%;border-radius:32px;filter:blur(18px);opacity:.36;background:linear-gradient(90deg, transparent, rgba(124,255,0,.18), transparent);transform:rotate(-10deg);animation:cov-beam 14s ease-in-out infinite}
      @keyframes cov-beam{0%,100%{transform:translateX(0) rotate(-10deg)}50%{transform:translateX(3%) rotate(-10deg)}}

      .cov-globe{position:absolute;right:6%;left:auto;top:20%;width:min(44vmin,520px);height:auto;opacity:.9;filter:drop-shadow(0 8px 20px rgba(32,211,194,.12))}

      .cov-arcs{position:absolute;left:0;right:20%;top:22%;height:56%;opacity:.95}
      .arc{fill:none;stroke:url(#cov-arc);stroke-width:1.2;stroke-linecap:round;stroke-dasharray:200;animation:cov-arc 10s linear infinite}
      .arc.slow{animation-duration:12s;opacity:.85}
      .arc.slow2{animation-duration:13.5s;opacity:.75}
      @keyframes cov-arc{0%{stroke-dashoffset:200}100%{stroke-dashoffset:-200}}
      .parcel{fill:#fff;filter:drop-shadow(0 0 4px rgba(124,255,0,.9));opacity:.95}

      @media (prefers-reduced-motion: reduce){
        .cov-dots,.cov-aurora,.cov-beam,.arc,.parcel{animation:none}
      }
    `}</style>
  );
}