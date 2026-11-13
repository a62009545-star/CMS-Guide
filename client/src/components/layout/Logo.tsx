import { Link } from 'react-router-dom';
import { AirtelMark } from '@/components/brand/AirtelMark';

/** Airtel mark with the product name. To use the official lockup instead, swap in /public/logo.svg here. */
export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-md" aria-label="CMS Process Guide, Airtel, home">
      <AirtelMark className="h-7 w-7 text-brand" title="" />
      <span className="hidden leading-none sm:block">
        <span className="block text-[0.9375rem] font-semibold tracking-tight">CMS Process Guide</span>
        <span className="mt-0.5 block text-[11px] text-ink-muted">Airtel Change Management</span>
      </span>
    </Link>
  );
}
