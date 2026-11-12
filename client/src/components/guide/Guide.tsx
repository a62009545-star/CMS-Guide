import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Mascot, type Reaction } from './Mascot';
import { guideFor, stepsForRole, type TourStep } from './tours';

const NAME = 'Relay';

/* ───────── Shared state: lets pages make the mascot react, and the account menu hide it ───────── */

interface GuideCtx {
  cue: (r: Reaction) => void;
  cueState: { reaction: Reaction; id: number } | null;
  hidden: boolean;
  setHidden: (h: boolean) => void;
}

const Ctx = createContext<GuideCtx>({ cue: () => {}, cueState: null, hidden: false, setHidden: () => {} });
export const useGuide = () => useContext(Ctx);

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, v: string) {
    try {
      localStorage.setItem(key, v);
    } catch {
      /* storage unavailable: the guide still works, it just forgets */
    }
  },
};

export function GuideProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const hiddenKey = `cms-guide-hidden:${user?._id ?? 'anon'}`;
  const [hidden, setHiddenState] = useState(false);
  const [cueState, setCueState] = useState<GuideCtx['cueState']>(null);
  useEffect(() => setHiddenState(store.get(hiddenKey) === '1'), [hiddenKey]);
  const setHidden = useCallback(
    (h: boolean) => {
      setHiddenState(h);
      store.set(hiddenKey, h ? '1' : '0');
    },
    [hiddenKey],
  );
  const cue = useCallback((reaction: Reaction) => setCueState({ reaction, id: Date.now() }), []);
  const value = useMemo(() => ({ cue, cueState, hidden, setHidden }), [cue, cueState, hidden, setHidden]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ───────── Target lookup ───────── */

function findTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null;
  const el = document.querySelector<HTMLElement>(step.target);
  if (!el || el.closest('[data-staff-only]')) return null; // never point at admin/editor controls
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

/** Steps whose target is on screen right now (steps without a target always count). */
const available = (steps: TourStep[]) => steps.filter((s) => !s.target || findTarget(s));

function useRect(el: HTMLElement | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!el) return setRect(null);
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    };
    update();
    window.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [el]);
  return rect;
}

function Spotlight({ rect }: { rect: DOMRect }) {
  const pad = 6;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[34] rounded-xl ring-2 ring-brand motion-safe:transition-all motion-safe:duration-300"
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        boxShadow: '0 0 0 9999px rgb(26 26 26 / 0.32)',
      }}
    />
  );
}

/* ───────── The guide ───────── */

export function Guide() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { cueState, hidden, setHidden, cue } = useGuide();
  const guide = useMemo(() => guideFor(pathname), [pathname]);
  const steps = useMemo(() => (guide ? stepsForRole(guide, user?.role) : []), [guide, user?.role]);

  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef(false);
  const rect = useRect(target);
  const seenKey = `cms-guide-seen:${user?._id ?? 'anon'}`;

  const endTour = useCallback(() => {
    setTour(null);
    setTarget(null);
    setIndex(0);
  }, []);

  // New page: close everything, then greet readers the first time they reach this kind of page.
  useEffect(() => {
    setOpen(false);
    endTour();
    if (!guide || hidden) return;
    const seen = new Set((store.get(seenKey) ?? '').split(',').filter(Boolean));
    if (seen.has(guide.key)) return;
    const t = window.setTimeout(() => {
      seen.add(guide.key);
      store.set(seenKey, [...seen].join(','));
      setOpen(true);
      cue('wink');
    }, 900);
    return () => window.clearTimeout(t);
  }, [guide, hidden, seenKey, endTour, cue]);

  // Point at the current tour step.
  useEffect(() => {
    if (!tour) return;
    const el = findTarget(tour[index]);
    setTarget(el);
    el?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [tour, index]);

  useEffect(() => {
    if (open && focusOnOpen.current) bubbleRef.current?.querySelector<HTMLElement>('button')?.focus();
    focusOnOpen.current = false;
  }, [open, tour, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      setOpen(false);
      endTour();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, endTour]);

  if (!guide || hidden || !user) return null;

  const start = () => {
    const list = available(steps);
    if (!list.length) return;
    setIndex(0);
    setTour(list);
    focusOnOpen.current = true;
  };
  const next = () => {
    if (!tour) return;
    if (index < tour.length - 1) {
      setIndex(index + 1);
      return;
    }
    endTour();
    setOpen(false);
    cue('sparkle');
  };
  const close = () => {
    setOpen(false);
    endTour();
  };
  const hide = () => {
    close();
    setHidden(true);
    toast(`${NAME} is hidden`, { description: 'Turn the guide back on from your account menu.' });
  };

  const step = tour?.[index];
  const lookAt = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
  const canTour = available(steps).length > 0;
  // On narrow screens the walkthrough's step bar sits at the bottom, so lift the mascot above it.
  const raised = pathname.split('/').filter(Boolean).length === 3;

  return (
    <>
      {tour && rect && <Spotlight rect={rect} />}
      <div className={cn('fixed left-3 z-[35] flex flex-col items-start gap-3 sm:left-5', raised ? 'bottom-20 lg:bottom-5' : 'bottom-4 sm:bottom-5')}>
        {open && (
          <div
            ref={bubbleRef}
            id="guide-bubble"
            role="region"
            aria-label={`${NAME}, your guide`}
            aria-live="polite"
            className="relative w-[min(330px,calc(100vw-24px))] animate-pop-in rounded-xl border border-line bg-surface p-4 shadow-raised"
          >
            <button onClick={close} className="absolute right-2 top-2 rounded-md p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink" aria-label="Close guide">
              <X className="h-4 w-4" />
            </button>
            {step ? (
              <>
                <p className="tabular text-xs text-ink-muted">
                  {index + 1} of {tour!.length}
                </p>
                <p className="mt-1 pr-6 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.text}</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={close} className="mr-auto text-sm text-ink-muted hover:text-ink">
                    End tour
                  </button>
                  {index > 0 && (
                    <Button size="sm" onClick={() => setIndex(index - 1)}>
                      Back
                    </Button>
                  )}
                  <Button size="sm" variant="primary" onClick={next}>
                    {index < tour!.length - 1 ? 'Next' : 'Done'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-brand-fg">{NAME}</p>
                <p className="mt-1 pr-6 text-sm leading-relaxed">{guide.greeting}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {canTour && (
                    <Button size="sm" variant="primary" onClick={start}>
                      Show me around
                    </Button>
                  )}
                  <Button size="sm" onClick={close}>
                    {canTour ? 'Not now' : 'Got it'}
                  </Button>
                  <button onClick={hide} className="ml-auto text-xs text-ink-muted hover:text-ink">
                    Hide {NAME}
                  </button>
                </div>
              </>
            )}
            {/* Tail pointing at the mascot */}
            <span aria-hidden className="absolute -bottom-[7px] left-8 h-3 w-3 rotate-45 border-b border-r border-line bg-surface" />
          </div>
        )}
        <div className="rounded-full border border-line bg-surface p-1 shadow-raised">
          <Mascot
            directions="/mascot/robot-directions.webp"
            reactions="/mascot/robot-reactions.webp"
            size={64}
            className="sm:!h-[76px] sm:!w-[76px]"
            label={open ? `Close ${NAME}, your guide` : `Open ${NAME}, your guide`}
            expanded={open}
            controls="guide-bubble"
            cue={cueState}
            lookAt={lookAt}
            onClick={() => {
              if (open) return close();
              focusOnOpen.current = true;
              setOpen(true);
            }}
          />
        </div>
      </div>
    </>
  );
}
