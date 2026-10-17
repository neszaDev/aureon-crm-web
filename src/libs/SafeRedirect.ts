import { routing } from '@/libs/I18nRouting';

const MAX_LENGTH = 512;
const LOCALE_PREFIX = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`, 'u');
const ALLOWED_PATH = /^\/(?:app(?:\/|$)|invite\/)/u;
// Browsers drop some control characters (tab, newline), which would turn `/\t/x` into `//x`.
const CONTROL_CHARACTER = /\p{Cc}/u;
// `%2e` too: URL parsers resolve it like a literal dot.
const DOT_SEGMENT = /^(?:\.|%2e){1,2}$/iu;

/**
 * Checks a `next` value (from the URL, so untrusted) before redirecting to it.
 * Only in-app paths under `/app` or `/invite/`, with or without a locale prefix, pass.
 * @param value The raw value.
 * @returns The path without its locale prefix (the caller adds the current one), or
 * `undefined` when it isn't safe to redirect to.
 */
export const safeNextPath = (value: unknown): string | undefined => {
  if (
    typeof value !== 'string' ||
    value.length > MAX_LENGTH ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHARACTER.test(value)
  ) {
    return undefined;
  }

  const href = value.replace(LOCALE_PREFIX, '');
  const [path = ''] = href.split(/[?#]/u, 1);
  if (!ALLOWED_PATH.test(path) || path.split('/').some((segment) => DOT_SEGMENT.test(segment))) {
    return undefined;
  }

  return href;
};
