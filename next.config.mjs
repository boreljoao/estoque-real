import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Needed so Next.js transpiles the TypeScript workspace packages
  transpilePackages: ["@stockpro/db", "@stockpro/types", "@stockpro/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ─── Security headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts + Stripe.js
              "script-src 'self' 'unsafe-inline' https://js.stripe.com",
              // Images: self, inline data URIs, Supabase storage
              "img-src 'self' data: https://*.supabase.co",
              // API calls: self, Supabase REST/Realtime, Stripe
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              // Stripe payment iframe
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // Fonts loaded by next/font are inlined; allow data: for any fallback
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  // Upload source maps to Sentry during build (requires SENTRY_AUTH_TOKEN env var)
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silently swallow Sentry upload errors — never block a build because of monitoring
  silent: true,

  // Automatically instrument Next.js data fetchers, API routes, and Server Actions
  autoInstrumentServerFunctions: true,

  // Tree-shake Sentry debug code from client bundles
  disableLogger: true,

  // Avoid bundling Sentry telemetry in the client chunk
  telemetry: false,
});
