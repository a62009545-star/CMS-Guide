import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Position near the top, like a command palette. */
  top?: boolean;
  labelledBy?: string;
  bare?: boolean;
}

const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Accessible dialog: focus moves in on open, Esc closes, focus is trapped and restored on close. */
export function Modal({ open, onClose, title, children, footer, size = 'md', top, bare }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusable = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    (el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const f = focusable();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex justify-center p-3 sm:p-6', top ? 'items-start pt-[10vh]' : 'items-center')}>
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn('relative flex max-h-[85vh] w-full animate-pop-in flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-raised', sizes[size])}
      >
        {!bare && title && (
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
            <h2 className="text-base font-semibold">{title}</h2>
            <button onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto', !bare && 'px-5 py-4')}>{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-sunken/50 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
