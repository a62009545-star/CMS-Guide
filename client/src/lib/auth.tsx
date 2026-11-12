import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { post } from '@/api/client';
import { qk, useMe } from '@/api/queries';
import type { User } from '@/api/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useMe();
  const user = data ?? null;

  useEffect(() => {
    const onUnauthorized = () => qc.setQueryData(qk.me, null);
    window.addEventListener('cms:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cms:unauthorized', onUnauthorized);
  }, [qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await post<{ user: User }>('/auth/login', { email, password });
      qc.clear();
      qc.setQueryData(qk.me, user);
      return user;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await post('/auth/logout');
    qc.clear();
    qc.setQueryData(qk.me, null);
  }, [qc]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading: isLoading,
      isStaff: user?.role === 'admin' || user?.role === 'editor',
      isAdmin: user?.role === 'admin',
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
