import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { signOut } from '@/actions/AuthActions';
import { acceptInvitation, registerThroughInvitation } from '@/actions/crm/InvitationAcceptActions';
import { InvitationCard } from '@/components/crm/InvitationCard';
import { getInvitationPreview } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { ACCESS_TOKEN_COOKIE } from '@/libs/Auth';
import { InvitationTokenValidation } from '@/validations/crm/InvitationValidation';

type InvitePageProps = {
  params: Promise<{ locale: string; token: string }>;
};

// Shows who is invited and whether the link still works: never prerender or cache it.
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: InvitePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'InvitePage' });

  // The token is in this page's URL: no Referer may carry it to another site.
  return { title: t('meta_title'), referrer: 'no-referrer' };
}

export default async function InvitePage(props: InvitePageProps) {
  const { locale, token } = await props.params;
  setRequestLocale(locale);

  const { invitation, notFound } = InvitationTokenValidation.safeParse(token).success
    ? await getInvitationPreview(token)
    : { invitation: undefined, notFound: true };
  if (!invitation && !notFound) {
    throw new Error('Could not load the invitation');
  }

  // Signed out: no need to ask the backend who this is.
  const jar = await cookies();
  const signedIn = Boolean(jar.get(ACCESS_TOKEN_COOKIE)?.value);
  const { user, unauthorized } = signedIn
    ? await getCurrentUser()
    : { user: undefined, unauthorized: false };
  if (unauthorized) {
    return endRejectedSession(locale);
  }
  if (signedIn && !user) {
    // A 5xx, not a lost session: the error page offers a retry.
    throw new Error('Could not load the signed-in user');
  }

  return (
    <InvitationCard
      token={token}
      invitation={invitation}
      user={user}
      accept={acceptInvitation}
      register={registerThroughInvitation}
      signOut={signOut}
    />
  );
}
