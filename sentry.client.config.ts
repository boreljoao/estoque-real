import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring (adjust for production load)
  tracesSampleRate: 0.1,

  // Replay 1% of normal sessions; 100% of sessions that had an error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production to avoid noise in dev/preview
  enabled: process.env.NODE_ENV === 'production',

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy
      maskAllText:    true,
      blockAllMedia:  true,
    }),
  ],
})
