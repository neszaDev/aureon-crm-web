import './src/libs/Env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// On every response: only the app frames its pages (clickjacking), nothing is sniffed, other
// sites get the origin alone as Referer, and no page asks for the device's features. No
// script-src: a nonce makes every page dynamic (docs/architecture.md, "Security headers").
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const baseConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: process.env.NODE_ENV === 'production', // Keep the development environment fast
  experimental: {
    // Use the Rust version, instead of the OG Babel one
    turbopackRustReactCompiler: process.env.NODE_ENV === 'production',
    // File uploads go through a server action: the backend accepts up to 10MB (FILES_MAX_SIZE),
    // plus multipart overhead. The proxy buffers bodies too, and truncates past its limit. Only
    // the files page gets this much: `src/proxy.ts` refuses a body over 1 MiB anywhere else.
    serverActions: { bodySizeLimit: '11mb' },
    proxyClientMaxBodySize: '11mb',
  },
  logging: {
    browserToTerminal: process.env.BROWSER_TO_TERMINAL_DISABLED !== 'true',
    // Dev logs print Server Function arguments: passwords and invitation tokens. Never.
    serverFunctions: false,
    // Invitation tokens are secrets: keep invite URLs, and a sign-in `next` to one, out of the log.
    incomingRequests: {
      ignore: [/\/invite\//u, /[?&]next=(?:%2F|\/)(?:[a-z]{2}(?:%2F|\/))?invite/iu],
    },
  },
  headers: async () => {
    // Next wants a promise; nothing to wait for.
    await Promise.resolve();

    // For the same header, a later rule wins.
    return [
      {
        // Every path but the build's own assets (never framed, typed by Next; ~11 KB less on the
        // home page's load) and a file's download, under any first segment (`[locale]` takes
        // any), whose route sets its own sandbox CSP: Next would send this one instead.
        source: '/:path((?!_next/static/|(?:[^/]+/)?dashboard/files/[^/]+/content$).*)',
        headers: SECURITY_HEADERS,
      },
      {
        // The token is in the invite page's URL: no Referer may carry it (the page sets the meta
        // too).
        source: '/:locale?/invite/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
  // Self-contained server in .next/standalone, used by docker/Dockerfile.
  output: 'standalone',
};

const nextConfig = createNextIntlPlugin('./src/libs/I18n.ts')(baseConfig);
export default nextConfig;
