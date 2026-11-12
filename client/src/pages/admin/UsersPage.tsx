import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ROLES, userCreateSchema, type Role } from '@cms/shared';
import { del, errorMessage, get, patch, post } from '@/api/client';
import type { Page, User } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { zodErrors, type Errors } from './EditorParts';

const roleHelp: Record<Role, string> = {
  viewer: 'Reads published content, searches and bookmarks.',
  editor: 'Creates and edits content. An Admin publishes it.',
  admin: 'Full control, including publishing and managing people.',
};

function NewUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'viewer' as Role });
  const [errors, setErrors] = useState<Errors>({});
  const m = useMutation({
    mutationFn: (body: unknown) => post('/users', body),
    onSuccess: () => {
      toast.success('Account created');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setF({ name: '', email: '', password: '', role: 'viewer' });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = userCreateSchema.safeParse(f);
    if (!r.success) return setErrors(zodErrors(r.error));
    setErrors({});
    m.mutate(r.data);
  };
  return (
    <Modal open={open} onClose={onClose} title="Add a person">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Name" htmlFor="u-name" error={errors.name}>
          <Input id="u-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-autofocus />
        </Field>
        <Field label="Work email" htmlFor="u-email" error={errors.email}>
          <Input id="u-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Temporary password" htmlFor="u-pw" error={errors.password} hint="At least 10 characters with upper and lower case letters and a number.">
          <Input id="u-pw" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </Field>
        <Field label="Role" htmlFor="u-role" hint={roleHelp[f.role]}>
          <Select id="u-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r[0].toUpperCase() + r.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={m.isPending}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersPage() {
  useDocumentTitle('Users & roles');
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', q, page],
    queryFn: () => get<Page<User>>('/users', { q, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => patch(`/users/${id}`, body),
    onSuccess: () => {
      toast.success('Role updated. They will need to sign in again.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/users/${id}`),
    onSuccess: () => {
      toast.success('Account deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users & roles</h1>
          <p className="mt-1 text-sm text-ink-muted">Viewers read. Editors draft. Admins publish and manage people.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add person
        </Button>
      </div>
      <Input className="mb-4 max-w-sm" placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search people" />
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.items.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      className="h-9 w-32"
                      aria-label={`Role for ${u.name}`}
                      disabled={u._id === me?._id}
                      onChange={async (e) => {
                        const role = e.target.value as Role;
                        if (await confirm({ title: `Make ${u.name} ${role === 'admin' ? 'an' : 'a'} ${role}?`, body: roleHelp[role], confirmLabel: 'Change role' }))
                          update.mutate({ id: u._id, body: { role } });
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r[0].toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-right">
                    {u._id !== me?._id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand-fg"
                        onClick={async () => {
                          if (await confirm({ title: `Delete ${u.name}'s account?`, body: 'They will lose access immediately.', confirmLabel: 'Delete account', danger: true }))
                            remove.mutate(u._id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="tabular text-ink-muted">Page {data.page} of {data.pages}</span>
          <Button size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
      <NewUserModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
