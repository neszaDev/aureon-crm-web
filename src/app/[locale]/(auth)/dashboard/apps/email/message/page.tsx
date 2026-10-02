import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { toFolder } from '@/components/showcase/apps/email/mailbox';
import { MessageView } from '@/components/showcase/apps/email/MessageView';

type MessagePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string; folder?: string }>;
};

export default async function MessagePage(props: MessagePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'MessagePage' });
  const searchParams = await props.searchParams;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <MessageView id={searchParams.id} folder={toFolder(searchParams.folder)} />
    </>
  );
}
