import './src/libs/Env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

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
    // plus multipart overhead. The proxy buffers bodies too, and truncates past its limit.
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
  // The token is in the invite page's URL: no Referer may carry it (the page sets the meta too).
  headers: async () => {
    // Next wants a promise; nothing to wait for.
    await Promise.resolve();

    return [
      {
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
