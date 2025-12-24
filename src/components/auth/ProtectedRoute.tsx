/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Combined auth check: redirect to login if not authenticated, or home if missing role
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      navigate({
        to: redirectTo,
        search: { redirect: currentPath },
      });
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // User doesn't have required role
      navigate({ to: '/' });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, requiredRole, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has specific role
 */
export function useRequireAuth(requiredRole?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      navigate({
        to: '/login',
        search: { redirect: currentPath },
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const hasRole = !requiredRole || user?.role === requiredRole;
  const isAuthorized = isAuthenticated && hasRole;

  return {
    isLoading,
    isAuthenticated,
    isAuthorized,
    user,
  };
}

/**
 * Hook to redirect authenticated users (e.g., from login page)
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/') {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isLoading, isAuthenticated };
}
