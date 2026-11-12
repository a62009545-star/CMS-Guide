import type { Faq, Guideline } from '@cms/shared';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const kinds = {
  must: { label: 'Must', cls: 'bg-brand text-white' },
  should: { label: 'Should', cls: 'bg-ink text-canvas' },
  note: { label: 'Note', cls: 'bg-info/10 text-info' },
};

export function GuidelineList({ items }: { items: Guideline[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((g, i) => (
        <li key={i} id={`guideline-${i + 1}`} className="flex scroll-mt-24 gap-4 py-3.5 first:pt-0 last:pb-0">
          <span className={cn('mt-0.5 inline-flex h-6 w-16 shrink-0 items-center justify-center rounded-md text-xs font-semibold', kinds[g.type].cls)}>
            {kinds[g.type].label}
          </span>
          <span className="text-[0.9375rem] leading-relaxed">{g.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line">
      {items.map((f, i) => (
        <details key={i} id={`faq-${i + 1}`} className="group scroll-mt-24 py-1">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md py-3 font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="max-w-prose pb-4 text-[0.9375rem] leading-relaxed text-ink-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
