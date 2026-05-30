import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-[#0f1712]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage-200 border-t-sage-600 dark:border-white/10 dark:border-t-sage-400" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate replace to="/dashboard" /> : children;
}
