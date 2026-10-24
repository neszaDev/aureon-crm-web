import { createNavigation } from 'next-intl/navigation';
import { routing } from './I18nRouting';

export const { Link, getPathname, redirect, usePathname, useRouter } = createNavigation(routing);

// A URL's query has no locale in it: Next's own hook, from here with the rest (and mocked with
// them in tests).
export { useSearchParams } from 'next/navigation';
