import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong active:bg-brand-strong disabled:bg-brand/50',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-sunken',
  ghost: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  danger: 'border border-brand/40 bg-surface text-brand-fg hover:bg-brand-soft',
};
const sizes: Record<Size, string> = { sm: 'h-8 px-3 text-sm gap-1.5', md: 'h-10 px-4 text-sm gap-2' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
