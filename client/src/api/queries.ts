import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { get } from './client';
import type { AuditEntry, ModuleDetail, ModuleListItem, Page, SearchDoc, SubTaskDetail, User } from './types';

/** Central query keys so realtime events can invalidate exactly what changed. */
export const qk = {
  me: ['me'] as const,
  modules: ['modules'] as const,
  module: (slug: string, preview = false) => ['module', slug, preview] as const,
  subTask: (moduleSlug: string, slug: string, preview = false) => ['subtask', moduleSlug, slug, preview] as const,
  searchIndex: ['search-index'] as const,
  activity: ['activity'] as const,
  bookmarks: ['bookmarks'] as const,
  admin: ['admin'] as const,
};

export const useMe = () =>
  useQuery({
    queryKey: qk.me,
    queryFn: () => get<{ user: User }>('/auth/me').then((r) => r.user),
    retry: false,
    staleTime: 5 * 60_000,
  });

export const useModules = () =>
  useQuery({ queryKey: qk.modules, queryFn: () => get<{ items: ModuleListItem[] }>('/modules').then((r) => r.items) });

/** Modules split by section, each in its own order. Older records without a section count as lifecycle. */
export function useModuleSections() {
  const q = useModules();
  const sections = useMemo(() => {
    const all = q.data ?? [];
    return {
      lifecycle: all.filter((m) => (m.section ?? 'lifecycle') === 'lifecycle'),
      configuration: all.filter((m) => m.section === 'configuration'),
    };
  }, [q.data]);
  return { ...q, ...sections };
}

export const useModule = (slug: string, preview = false) =>
  useQuery({ queryKey: qk.module(slug, preview), queryFn: () => get<ModuleDetail>(`/modules/${slug}`, { preview: preview ? 1 : undefined }) });

export const useSubTask = (moduleSlug: string, slug: string, preview = false) =>
  useQuery({
    queryKey: qk.subTask(moduleSlug, slug, preview),
    queryFn: () => get<SubTaskDetail>(`/subtasks/by-slug/${moduleSlug}/${slug}`, { preview: preview ? 1 : undefined }),
  });

export const useSearchIndex = (enabled = true) =>
  useQuery({
    queryKey: qk.searchIndex,
    queryFn: () => get<{ items: SearchDoc[]; modules: { _id: string; title: string }[] }>('/search/index'),
    staleTime: 5 * 60_000,
    enabled,
  });

export const useActivity = (limit = 15) =>
  useQuery({ queryKey: [...qk.activity, limit], queryFn: () => get<Page<AuditEntry>>('/activity', { limit }) });
