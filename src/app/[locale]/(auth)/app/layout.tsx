import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';

// Everything below is personal: never prerender or cache it.
export const dynamic = 'force-dynamic';

export default async function CrmLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const { user, unauthorized } = await getCurrentUser();
  if (unauthorized) {
    return endRejectedSession(locale);
  }
  if (!user) {
    // A 5xx, not a lost session: the error page offers a retry. Sending the user to sign-in
    // would loop, since the proxy still sees a valid access cookie.
    throw new Error('Could not load the signed-in user');
  }

  // Every message, for the CRM's client components (the root layout passes the public pages').
  return <NextIntlClientProvider>{props.children}</NextIntlClientProvider>;
}
