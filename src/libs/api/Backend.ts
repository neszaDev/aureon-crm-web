import 'server-only';
import { cookies } from 'next/headers';
import createClient from 'openapi-fetch';
import { ACCESS_TOKEN_COOKIE } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import type { paths } from './schema';

/**
 * Typed client for the Spring API; paths and bodies come from `schema.d.ts`, generated from
 * the backend's OpenAPI spec (`pnpm api:types`). Server-side only.
 */
export const backend = createClient<paths>({ baseUrl: Env.BACKEND_URL, cache: 'no-store' });

/**
 * Creates a typed backend client that sends the signed-in user's access token.
 * The proxy refreshes the token before protected pages render, so it's normally valid here.
 * @returns A client with the `Authorization: Bearer` header set (or none if signed out).
 */
export const authedBackend = async () => {
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;

  return createClient<paths>({
    baseUrl: Env.BACKEND_URL,
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
