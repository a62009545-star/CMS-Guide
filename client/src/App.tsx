import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { GuideProvider } from '@/components/guide/Guide';
import { AppShell } from '@/components/layout/AppShell';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { AuthProvider, useAuth } from '@/lib/auth';
import { RealtimeBridge } from '@/lib/realtime';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { ConfigurationPage } from '@/pages/ConfigurationPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ModulePage } from '@/pages/ModulePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SearchPage } from '@/pages/SearchPage';
import { SubTaskPage } from '@/pages/SubTaskPage';

// The admin area (and the TipTap editor it pulls in) loads only for staff who open it.
const AdminRoutes = lazy(() => import('@/pages/admin/AdminRoutes'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="mx-auto max-w-4xl p-8">
        <PageSkeleton />
      </div>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  return <>{children}</>;
}

function RequireStaff({ children }: { children: ReactNode }) {
  const { isStaff } = useAuth();
  return isStaff ? <>{children}</> : <NotFoundPage />;
}

export function App() {
  return (
    <AuthProvider>
      <GuideProvider>
      <ConfirmProvider>
        <RealtimeBridge />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="modules/:moduleSlug" element={<ModulePage />} />
            <Route path="modules/:moduleSlug/:subSlug" element={<SubTaskPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route path="configuration/:moduleSlug" element={<ModulePage />} />
            <Route path="configuration/:moduleSlug/:subSlug" element={<SubTaskPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route
              path="admin/*"
              element={
                <RequireStaff>
                  <Suspense fallback={<div className="p-8"><PageSkeleton /></div>}>
                    <AdminRoutes />
                  </Suspense>
                </RequireStaff>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" closeButton toastOptions={{ className: 'font-sans' }} />
      </ConfirmProvider>
      </GuideProvider>
    </AuthProvider>
  );
}
