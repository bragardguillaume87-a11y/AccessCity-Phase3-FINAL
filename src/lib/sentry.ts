/**
 * Sentry Configuration
 *
 * Error monitoring and performance tracking for AccessCity.
 * Sentry captures errors in production and provides detailed reports.
 *
 * Setup:
 * 1. Create account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy DSN to .env file as VITE_SENTRY_DSN
 *
 * Free tier: 5,000 errors/month
 */

import * as Sentry from '@sentry/react';

// Only initialize in production or if DSN is provided
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;

export function initSentry(): void {
  // Skip initialization if no DSN or in development without DSN
  if (!SENTRY_DSN) {
    if (IS_PRODUCTION) {
      console.warn('[Sentry] No DSN provided. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment tagging
    environment: IS_PRODUCTION ? 'production' : 'development',

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Session replay for debugging (captures user sessions on error)
      Sentry.replayIntegration({
        // Mask all text content for privacy
        maskAllText: false,
        // Block all media for privacy
        blockAllMedia: false,
      }),
    ],

    // Performance monitoring
    // Capture 100% of transactions in dev, 10% in production
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

    // Session Replay
    // Capture 10% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking (set by CI/CD)
    release: import.meta.env.VITE_APP_VERSION || 'dev',

    // Filter out known non-critical errors
    beforeSend(event) {
      // Ignore ResizeObserver errors (browser quirk)
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },
  });

  console.info('[Sentry] Initialized successfully');
}

// Export Sentry for use in components
export { Sentry };

// Export ErrorBoundary wrapper
export const SentryErrorBoundary = Sentry.ErrorBoundary;
