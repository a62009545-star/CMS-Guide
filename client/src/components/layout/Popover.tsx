import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Minimal disclosure popover: toggles on click, closes on outside click or Esc. */
export function Popover({
  trigger,
  children,
  className,
  onOpenChange,
  label,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  onOpenChange?: (o: boolean) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const set = (o: boolean) => {
    setOpen(o);
    onOpenChange?.(o);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && set(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && set(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => set(!open) })}
      {open && (
        <div role="dialog" aria-label={label} className={cn('absolute right-0 top-full z-40 mt-2 animate-pop-in rounded-xl border border-line bg-surface shadow-raised', className)}>
          {children(() => set(false))}
        </div>
      )}
    </div>
  );
}
