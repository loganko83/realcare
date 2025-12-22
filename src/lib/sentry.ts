/**
 * Sentry Error Tracking Configuration
 * Provides error monitoring and performance tracking for production
 */

import * as Sentry from '@sentry/react';

// Initialize Sentry only in production or when DSN is provided
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProduction = import.meta.env.PROD;

  if (!dsn) {
    if (isProduction) {
      console.warn('[Sentry] No DSN provided. Error tracking is disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: isProduction ? 'production' : 'development',

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in development

    // Session Replay (optional, for debugging)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: `realcare@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // Error filtering
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out known non-critical errors
      if (error instanceof Error) {
        // Ignore ResizeObserver errors (common browser quirk)
        if (error.message.includes('ResizeObserver')) {
          return null;
        }

        // Ignore network errors that are expected
        if (error.message.includes('Failed to fetch') &&
            error.message.includes('favicon')) {
          return null;
        }
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy console logs
      if (breadcrumb.category === 'console' &&
          breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },

    // Integration configuration
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
}

// Helper to capture errors with additional context
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Helper to set user context
export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

// Helper to add breadcrumb
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

// Export Sentry for direct access if needed
export { Sentry };
