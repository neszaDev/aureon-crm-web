import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { MAIL_LABELS } from '@/components/showcase/apps/email/data';
import { InboxView } from '@/components/showcase/apps/email/InboxView';
import { toFolder } from '@/components/showcase/apps/email/mailbox';

type InboxPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ folder?: string; label?: string }>;
};

export default async function InboxPage(props: InboxPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'InboxPage' });
  const searchParams = await props.searchParams;
  const folder = toFolder(searchParams.folder);
  const label = MAIL_LABELS.find((candidate) => candidate === searchParams.label);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {/* A new folder or label starts with a fresh selection and the first page. */}
      <InboxView key={label ?? folder} folder={folder} label={label} />
    </>
  );
}
