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
  },
  // Self-contained server in .next/standalone, used by docker/Dockerfile.
  output: 'standalone',
};

const nextConfig = createNextIntlPlugin('./src/libs/I18n.ts')(baseConfig);
export default nextConfig;
