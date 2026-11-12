import { Link } from 'react-router-dom';

/** Replace /public/logo.svg with the official logo. The wordmark text can be removed if the logo includes it. */
export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-md" aria-label="CMS Process Guide home">
      <img src="/logo.svg" alt="" className="h-8 w-8" />
      <span className="hidden text-[0.9375rem] font-semibold tracking-tight sm:block">CMS Process Guide</span>
    </Link>
  );
}
