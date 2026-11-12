import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '@cms/shared';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  useDocumentTitle('Sign in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      return setErrors({ email: f.email?.[0], password: f.password?.[0] });
    }
    setErrors({});
    setBusy(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-sunken px-4 py-12">
      <div className="w-full max-w-sm">
        <img src="/logo.svg" alt="" className="h-11 w-11" />
        <h1 className="mt-6 text-2xl font-semibold">Sign in to CMS Process Guide</h1>
        <p className="mt-1.5 text-sm text-ink-muted">How every stage of the Change Management System works, step by step.</p>
        <form onSubmit={submit} noValidate className="card mt-8 space-y-4 p-6">
          {errors.form && (
            <p role="alert" className="rounded-lg border border-brand/30 bg-brand-soft px-3 py-2 text-sm text-brand-fg">
              {errors.form}
            </p>
          )}
          <Field label="Work email" htmlFor="email" error={errors.email}>
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus aria-invalid={!!errors.email} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password}>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
          </Field>
          <Button type="submit" variant="primary" className="w-full" loading={busy}>
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-muted">Need access? Ask a CMS Process Guide admin to create your account.</p>
      </div>
    </div>
  );
}
