import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy configuration:
 * - default-src 'self'
 * - script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.openpanel.dev https://*.sentry.io
 * - style-src 'self' 'unsafe-inline'
 * - font-src 'self' data:
 * - img-src 'self' data: blob: https:
 * - connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.openpanel.dev https://*.sentry.io https://api.ollima.com https://api.ollagraph.com
 * - frame-ancestors 'none'
 * - base-uri 'self'
 * - form-action 'self'
 */
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.openpanel.dev https://*.sentry.io;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.openpanel.dev https://*.sentry.io https://api.ollima.com https://api.ollagraph.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@v1/ui", "@v1/backend", "@v1/analytics", "@v1/logger"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});
