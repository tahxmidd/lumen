/**
 * The daylight backdrop behind every screen: a pale morning sky, a radiant
 * sun in the upper right with slowly wheeling rays, and a green meadow
 * silhouette along the bottom. Pure CSS + inline SVG — no assets.
 */

/** A spiky grass edge: triangular blades marching across the width. */
function grassPath(baseY: number, step: number, minH: number, maxH: number, seed: number): string {
  let d = `M0 ${baseY}`;
  for (let x = 0, i = seed; x < 1440; x += step, i++) {
    const h = minH + ((i * 7) % (maxH - minH));
    d += ` L${x + step / 2} ${baseY - h} L${x + step} ${baseY}`;
  }
  d += ` L1440 160 L0 160 Z`;
  return d;
}

export function DaylightSky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #cfe3ec 0%, #dce8dd 38%, #eeead2 66%, #f4f0da 100%)",
        }}
      />

      {/* Wheeling rays */}
      <div
        className="absolute right-[-6%] top-[-14%] h-[620px] w-[620px]"
        style={{
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,252,235,0.55) 0deg 5deg, transparent 5deg 14deg)",
          maskImage: "radial-gradient(circle, black 0%, transparent 68%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 68%)",
          filter: "blur(6px)",
          animation: "lumen-rays 120s linear infinite",
        }}
      />

      {/* Sun glow */}
      <div
        className="absolute right-[2%] top-[-4%] h-[440px] w-[440px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,244,200,0.95) 0%, rgba(255,231,160,0.55) 34%, rgba(255,222,140,0.2) 58%, transparent 75%)",
        }}
      />

      {/* Sun core */}
      <div
        className="absolute right-[11%] top-[6%] h-36 w-36 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 42% 38%, #fffdf2 0%, #ffefb8 55%, #f7d878 100%)",
          boxShadow: "0 0 60px 24px rgba(255,232,160,0.55)",
        }}
      />

      {/* Meadow */}
      <svg
        className="absolute bottom-0 left-0 h-[24vh] min-h-36 w-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d={grassPath(34, 26, 10, 26, 3)} fill="#8fac6b" />
        <path d={grassPath(64, 22, 8, 22, 11)} fill="#6d9250" />
        <path d={grassPath(98, 18, 6, 18, 7)} fill="#557a3e" />
      </svg>

      {/* A small solar array planted in the meadow, catching the sun */}
      <svg
        className="absolute bottom-[2vh] left-[6%] h-[11vh] min-h-20 w-[42vw] max-w-[440px]"
        viewBox="0 0 440 110"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
      >
        <defs>
          <linearGradient id="panel-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#324a5f" />
            <stop offset="100%" stopColor="#182430" />
          </linearGradient>
          <linearGradient id="panel-glint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="42%" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="58%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M30 104 L34 66 M140 104 L144 64 M250 104 L254 64 M360 104 L364 66"
          stroke="#3a4a3a"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {[0, 110, 220, 330].map((x, i) => (
          <g key={i} transform={`translate(${x} 0) skewX(-6)`}>
            <rect x="10" y="18" width="90" height="52" rx="3" fill="url(#panel-face)" />
            <line x1="10" y1="44" x2="100" y2="44" stroke="#0d151c" strokeWidth="2" />
            <line x1="32" y1="18" x2="32" y2="70" stroke="#0d151c" strokeWidth="1.5" />
            <line x1="54" y1="18" x2="54" y2="70" stroke="#0d151c" strokeWidth="1.5" />
            <line x1="76" y1="18" x2="76" y2="70" stroke="#0d151c" strokeWidth="1.5" />
            <rect x="10" y="18" width="90" height="52" rx="3" fill="url(#panel-glint)" />
          </g>
        ))}
      </svg>

      {/* Soft haze where meadow meets sky, for card readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34vh]"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(244,240,218,0.35) 55%, transparent 100%)",
        }}
      />
    </div>
  );
}
