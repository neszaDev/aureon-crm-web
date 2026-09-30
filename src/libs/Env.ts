import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    // Where the Next.js server reaches the Spring API. Never exposed to the browser.
    BACKEND_URL: z.url(),
    // Public URL of this app. `https://` makes auth cookies `Secure`; used for sitemap/robots.
    APP_URL: z.url().default('http://localhost:3000'),
  },
  client: {
    NEXT_PUBLIC_LOGGING_LEVEL: z
      .enum(['error', 'info', 'debug', 'warning', 'trace', 'fatal'])
      .default('info'),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    BACKEND_URL: process.env.BACKEND_URL,
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_LOGGING_LEVEL: process.env.NEXT_PUBLIC_LOGGING_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
  },
  // `docker build` has no runtime configuration; validation runs when the server starts.
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
  emptyStringAsUndefined: true,
});
