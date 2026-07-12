"use client";

import type { SVGProps } from "react";

export type LumenMascotState = "idle" | "scanning" | "warning" | "success";

interface LumenMascotProps extends Omit<SVGProps<SVGSVGElement>, "viewBox"> {
  state?: LumenMascotState;
}

const GOLD = "#C9A227";
const OFF_BLACK = "#191C18";
const HAIRLINE = "#1F241E";
const OFF_WHITE = "#F4F6F2";
const RISK = "#B4402F";

const RAYS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  return {
    x1: 100 + Math.cos(angle) * 50,
    y1: 88 + Math.sin(angle) * 50,
    x2: 100 + Math.cos(angle) * 64,
    y2: 88 + Math.sin(angle) * 64,
  };
});

export function LumenMascot({
  state = "idle",
  className,
  ...props
}: LumenMascotProps) {
  const warning = state === "warning";
  const success = state === "success";
  const scanning = state === "scanning";

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`Lumen mascot: ${state}`}
      {...props}
    >
      <defs>
        <linearGradient id="lumen-warning-beam" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={RISK} stopOpacity="0.58" />
          <stop offset="100%" stopColor={RISK} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Solar rays */}
      <g
        stroke={GOLD}
        strokeWidth="4"
        strokeLinecap="round"
        className={
          scanning
            ? "animate-[spin_20s_linear_infinite]"
            : success
              ? "animate-pulse"
              : undefined
        }
        style={{ transformOrigin: "100px 88px" }}
      >
        {RAYS.map((ray, index) => (
          <line key={index} {...ray} />
        ))}
      </g>

      {/* Warning beam */}
      {warning && <path d="M49 148 L20 200 L104 200 Z" fill="url(#lumen-warning-beam)" />}

      {/* Arms and legs */}
      <g
        fill="none"
        stroke={OFF_WHITE}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={warning ? "M58 91 L52 120 L49 151" : "M58 91 L42 111 L30 104"} />
        <path d="M142 91 L158 110 L174 97" />
        <path d="M82 130 L76 155 L68 183" />
        <path d="M118 130 L124 155 L134 183" />
      </g>

      {/* Golden sun body */}
      <circle cx="100" cy="88" r="44" fill={GOLD} stroke={HAIRLINE} strokeWidth="2" />

      {/* Detective sunglasses */}
      <g fill={OFF_BLACK} stroke={OFF_BLACK} strokeLinecap="round">
        <path d="M64 76 H94 L91 95 H68 Z" />
        <path d="M106 76 H136 L132 95 H109 Z" />
        <line x1="94" y1="82" x2="106" y2="82" strokeWidth="3" />
        <line x1="64" y1="80" x2="55" y2="83" strokeWidth="3" />
        <line x1="136" y1="80" x2="145" y2="83" strokeWidth="3" />
      </g>

      {/* Subtle smile */}
      <path
        d="M89 109 Q100 117 111 109"
        fill="none"
        stroke={OFF_BLACK}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Warning flashlight */}
      {warning && (
        <g>
          <rect
            x="42"
            y="144"
            width="14"
            height="20"
            rx="3"
            fill={OFF_BLACK}
            stroke={HAIRLINE}
            strokeWidth="1.5"
          />
          <circle cx="49" cy="149" r="3" fill={GOLD} />
        </g>
      )}

      {/* Success indicator */}
      {success && (
        <g transform="translate(174 97)">
          <circle r="14" fill={OFF_WHITE} stroke={GOLD} strokeWidth="2.5" />
          <path
            d="M-6 0 L-1 5 L7 -6"
            fill="none"
            stroke={GOLD}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
