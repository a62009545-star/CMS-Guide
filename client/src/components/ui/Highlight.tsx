import type { ReactNode } from 'react';

/** Wrap the given [start, end] (inclusive) ranges of text in <mark>. */
export function Highlight({ text, ranges }: { text: string; ranges: [number, number][] }) {
  if (!ranges.length) return <>{text}</>;
  const merged = [...ranges].sort((a, b) => a[0] - b[0]).reduce<[number, number][]>((acc, r) => {
    const last = acc[acc.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else acc.push([...r]);
    return acc;
  }, []);
  const out: ReactNode[] = [];
  let i = 0;
  merged.forEach(([a, b], k) => {
    if (a > i) out.push(text.slice(i, a));
    out.push(
      <mark key={k} className="hl">
        {text.slice(a, b + 1)}
      </mark>,
    );
    i = b + 1;
  });
  if (i < text.length) out.push(text.slice(i));
  return <>{out}</>;
}
