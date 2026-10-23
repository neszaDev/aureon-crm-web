'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Link } from '@/libs/I18nNavigation';

type AuthPage = '/sign-in' | '/sign-up';

const SwitchLink = (props: { href: AuthPage; next?: string | null; children: React.ReactNode }) => (
  <Link
    href={props.next ? { pathname: props.href, query: { next: props.next } } : props.href}
    className="font-semibold text-violet-ink underline decoration-violet-ink/40 underline-offset-4 hover:decoration-violet-ink"
  >
    {props.children}
  </Link>
);

const SwitchLinkWithNext = (props: { href: AuthPage; children: React.ReactNode }) => {
  const searchParams = useSearchParams();

  return (
    <SwitchLink href={props.href} next={searchParams.get('next')}>
      {props.children}
    </SwitchLink>
  );
};

/**
 * The link between sign-in and sign-up. It keeps the page's `?next=` (checked by the action that
 * finally uses it), so switching doesn't lose where the user was going, e.g. an invitation. The
 * query is read in the browser, so the auth pages stay static.
 * @param props Component props.
 * @param props.href The other auth page.
 * @param props.children The link text.
 * @returns The link.
 */
export const AuthSwitchLink = (props: { href: AuthPage; children: React.ReactNode }) => (
  <Suspense fallback={<SwitchLink href={props.href}>{props.children}</SwitchLink>}>
    <SwitchLinkWithNext href={props.href}>{props.children}</SwitchLinkWithNext>
  </Suspense>
);
