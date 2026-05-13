import React from "react";

/**
 * AI-Investor logo.
 * Props:
 *   size   — pixel size of the icon mark (default 36)
 *   full   — if true, renders icon + wordmark side-by-side
 *   mono   — if true, renders in single-color white (for dark backgrounds)
 */
export default function AppLogo({ size = 36, full = false, mono = false }) {
  const id = React.useId().replace(/:/g, "");

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28 }}>
      {/* ── Icon mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main gradient: indigo → violet */}
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={mono ? "#ffffff" : "#6366f1"} />
            <stop offset="100%" stopColor={mono ? "#ffffff" : "#a855f7"} />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Hexagon background ── */}
        <path
          d="M32 3 L57 17.5 L57 46.5 L32 61 L7 46.5 L7 17.5 Z"
          fill={mono ? "rgba(255,255,255,0.12)" : "rgba(99,102,241,0.12)"}
          stroke={`url(#grad-${id})`}
          strokeWidth="1.5"
        />

        {/* ── Candlestick bars (left to right, rising) ── */}
        {/* Bar 1 — bear/red, short */}
        <rect x="14" y="38" width="5" height="10" rx="1.2"
          fill={mono ? "rgba(255,255,255,0.35)" : "#f43f5e"} />
        <line x1="16.5" y1="35" x2="16.5" y2="38" stroke={mono ? "rgba(255,255,255,0.35)" : "#f43f5e"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16.5" y1="48" x2="16.5" y2="51" stroke={mono ? "rgba(255,255,255,0.35)" : "#f43f5e"} strokeWidth="1.5" strokeLinecap="round" />

        {/* Bar 2 — bull, medium */}
        <rect x="23" y="31" width="5" height="14" rx="1.2"
          fill={mono ? "rgba(255,255,255,0.55)" : "url(#grad-" + id + ")"} />
        <line x1="25.5" y1="27" x2="25.5" y2="31" stroke={mono ? "rgba(255,255,255,0.55)" : "#6366f1"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25.5" y1="45" x2="25.5" y2="48" stroke={mono ? "rgba(255,255,255,0.55)" : "#6366f1"} strokeWidth="1.5" strokeLinecap="round" />

        {/* Bar 3 — bull, tall */}
        <rect x="32" y="22" width="5" height="22" rx="1.2"
          fill={mono ? "rgba(255,255,255,0.75)" : "url(#grad-" + id + ")"} />
        <line x1="34.5" y1="18" x2="34.5" y2="22" stroke={mono ? "rgba(255,255,255,0.75)" : "#7c3aed"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="34.5" y1="44" x2="34.5" y2="47" stroke={mono ? "rgba(255,255,255,0.75)" : "#7c3aed"} strokeWidth="1.5" strokeLinecap="round" />

        {/* Bar 4 — bull, tallest */}
        <rect x="41" y="15" width="5" height="28" rx="1.2"
          fill={mono ? "#ffffff" : "url(#grad-" + id + ")"} filter={`url(#glow-${id})`} />
        <line x1="43.5" y1="11" x2="43.5" y2="15" stroke={mono ? "#ffffff" : "#a855f7"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="43.5" y1="43" x2="43.5" y2="46" stroke={mono ? "#ffffff" : "#a855f7"} strokeWidth="1.5" strokeLinecap="round" />

        {/* ── Trend arrow overlay ── */}
        <polyline
          points="14,42 24,34 33,27 43.5,16"
          stroke={`url(#grad-${id})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 2"
          opacity="0.6"
        />

        {/* ── AI spark dot — top-right corner ── */}
        <circle cx="50" cy="14" r="5" fill={mono ? "#ffffff" : "#a855f7"} filter={`url(#glow-${id})`} />
        <text
          x="50" y="18"
          textAnchor="middle"
          fontSize="6"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
          fill="#ffffff"
        >
          AI
        </text>
      </svg>

      {/* ── Wordmark (shown when full=true) ── */}
      {full && (
        <svg
          height={size * 0.55}
          viewBox="0 0 120 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="AI-Investor"
        >
          <defs>
            <linearGradient id={`wm-${id}`} x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={mono ? "#ffffff" : "#6366f1"} />
              <stop offset="100%" stopColor={mono ? "#ffffff" : "#a855f7"} />
            </linearGradient>
          </defs>
          <text
            x="0"
            y="17"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="17"
            letterSpacing="-0.5"
            fill={`url(#wm-${id})`}
          >
            AI
          </text>
          <text
            x="25"
            y="17"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="400"
            fontSize="17"
            letterSpacing="-0.3"
            fill={mono ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.85)"}
          >
            -Investor
          </text>
        </svg>
      )}
    </div>
  );
}
