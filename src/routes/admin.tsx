/**
 * Admin Layout Route
 * Protects all admin routes using TanStack Router beforeLoad
 */

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    // Check for access token
    const accessToken = localStorage.getItem('realcare_access_token');

    if (!accessToken) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      });
    }

    // Parse JWT to check role
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.role === 'admin') {
          return; // Authorized
        }
      }
      // Not admin - redirect to home
      throw redirect({ to: '/' });
    } catch (e) {
      // If it's already a redirect, rethrow it
      if (e instanceof Response || (e && typeof e === 'object' && 'to' in e)) {
        throw e;
      }
      // Invalid token format - clear and redirect
      localStorage.removeItem('realcare_access_token');
      localStorage.removeItem('realcare_refresh_token');
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
