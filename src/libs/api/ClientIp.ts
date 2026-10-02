/**
 * The browser's address for the backend's per-IP rate limits: the last `X-Forwarded-For`
 * entry. Next.js sets the header from the connection when it is missing, and a proxy in front
 * of this server appends the address it saw, so the last entry is the one a client can't
 * choose. (With no proxy in front, a client can send its own header; the backend's per-email
 * limit still applies.)
 * @param forwardedFor The incoming `X-Forwarded-For` header.
 * @returns The address, or `undefined` when there is none.
 */
export const clientIpFrom = (forwardedFor: string | null) => {
  const last = forwardedFor?.split(',').at(-1)?.trim();

  return last === '' ? undefined : last;
};
