import { AlertTriangle, CircleX, Lightbulb } from 'lucide-react';
import type { CalloutType } from '@cms/shared';
import { cn } from '@/lib/utils';

const styles: Record<CalloutType, { label: string; icon: typeof Lightbulb; box: string; icon_: string }> = {
  tip: { label: 'Tip', icon: Lightbulb, box: 'border-success bg-success/[0.07]', icon_: 'text-success' },
  warning: { label: 'Warning', icon: AlertTriangle, box: 'border-warning bg-warning/[0.12]', icon_: 'text-[#9a6700] dark:text-warning' },
  error: { label: 'Common error', icon: CircleX, box: 'border-brand bg-brand/[0.06]', icon_: 'text-brand-fg' },
};

export function Callout({ type, text }: { type: CalloutType; text: string }) {
  const s = styles[type];
  const I = s.icon;
  return (
    <div className={cn('flex gap-3 rounded-lg border-l-[3px] px-4 py-3 text-[0.9375rem]', s.box)} role="note" data-guide="callout">
      <I className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', s.icon_)} aria-hidden />
      <p>
        <span className="font-semibold">{s.label}. </span>
        {text}
      </p>
    </div>
  );
}
