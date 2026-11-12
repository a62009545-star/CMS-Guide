import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { REALTIME_EVENT, type ContentEvent } from '@cms/shared';
import { qk } from '@/api/queries';
import { useAuth } from './auth';

/**
 * Listens for content changes over Socket.io, invalidates the affected TanStack Query caches so
 * open pages refetch, and tells the reader when the page they are on changed.
 */
export function RealtimeBridge() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (!user) return;
    const socket: Socket = io({ path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] });

    socket.on(REALTIME_EVENT, (e: ContentEvent) => {
      qc.invalidateQueries({ queryKey: qk.modules });
      qc.invalidateQueries({ queryKey: qk.searchIndex });
      qc.invalidateQueries({ queryKey: qk.activity });
      qc.invalidateQueries({ queryKey: qk.admin });
      qc.invalidateQueries({ queryKey: ['module'] });
      qc.invalidateQueries({ queryKey: ['subtask'] });
      qc.invalidateQueries({ queryKey: qk.bookmarks });

      if (e.by.id === user._id) return;
      const path = pathRef.current;
      const parts = path.split('/').filter(Boolean); // ['modules', moduleSlug, subSlug?]
      const onModule = parts[0] === 'modules' && parts.length === 2 && e.entityType === 'module' && e.slug === parts[1];
      const onSubTask = parts[0] === 'modules' && parts.length === 3 && e.entityType === 'subtask' && e.slug === parts[2] && e.moduleSlug === parts[1];
      const onParentModule = parts[0] === 'modules' && parts.length === 2 && e.entityType === 'subtask' && e.moduleSlug === parts[1];
      if (onModule || onSubTask) {
        toast(`This page was updated by ${e.by.name}`, { description: 'You are now seeing the latest version.' });
      } else if (onParentModule) {
        toast(`${e.by.name} updated “${e.title}”`, { description: 'The sub-task list on this page is up to date.' });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, qc]);

  return null;
}
