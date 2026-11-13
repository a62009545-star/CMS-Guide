/**
 * A faint network map of grey nodes and links around the edges of the hero.
 * Decorative only. Deterministic, so it never shifts between renders.
 */
const W = 1200;
const H = 420;

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const r = rng(42);
const nodes = Array.from({ length: 46 }, () => ({ x: Math.round(r() * W), y: Math.round(r() * H) }));
const links: [number, number][] = [];
nodes.forEach((a, i) => {
  const near = nodes
    .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
    .filter((n) => n.j !== i)
    .sort((p, q) => p.d - q.d)
    .slice(0, 2);
  near.forEach((n) => i < n.j && links.push([i, n.j]));
});

export function NetworkBackdrop({ className }: { className?: string }) {
  // Luminance mask: black (hidden) in the middle where the headline and search sit, white at the edges.
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="nb-fade" cx="50%" cy="46%" r="62%">
          <stop offset="0.42" stopColor="#000" />
          <stop offset="0.95" stopColor="#fff" />
        </radialGradient>
        <mask id="nb-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="url(#nb-fade)" />
        </mask>
      </defs>
      <g mask="url(#nb-mask)">
        <g className="text-line" stroke="currentColor" strokeWidth="1">
          {links.map(([a, b], i) => (
            <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
          ))}
        </g>
        <g className="text-ink-subtle/40" fill="currentColor">
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r="2.5" />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** Seven stations on one red line along the bottom edge of the hero: the lifecycle as a border. */
export function RouteEdge({ className }: { className?: string }) {
  const n = 7;
  return (
    <div className={className} aria-hidden>
      <div className="relative mx-auto h-6 max-w-5xl">
        <span className="absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-1/2 animate-route-draw bg-brand" />
        <div className="absolute inset-0 flex items-center justify-between">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="h-3.5 w-3.5 rounded-full border-2 border-brand bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
