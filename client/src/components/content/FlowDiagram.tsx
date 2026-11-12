import type { FlowStep } from '@cms/shared';

/** Module process flow: horizontal stepper on desktop, vertical on mobile. */
export function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  if (!steps.length) return null;
  const n = steps.length;
  return (
    <div>
      <ol className="relative hidden md:grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        <span aria-hidden className="absolute top-[13px] h-0.5 bg-brand" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} />
        {steps.map((s, i) => (
          <li key={i} className="relative flex flex-col items-center px-2 text-center">
            <span className="tabular relative z-10 grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-white ring-4 ring-surface">
              {i + 1}
            </span>
            <span className="mt-3 text-sm font-semibold leading-snug">{s.title}</span>
            {s.description && <span className="mt-1 text-xs leading-5 text-ink-muted">{s.description}</span>}
          </li>
        ))}
      </ol>
      <ol className="relative space-y-5 md:hidden">
        <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-0.5 bg-brand" />
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-4">
            <span className="tabular relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white ring-4 ring-surface">
              {i + 1}
            </span>
            <span className="pt-0.5">
              <span className="block text-sm font-semibold">{s.title}</span>
              {s.description && <span className="block text-sm text-ink-muted">{s.description}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
