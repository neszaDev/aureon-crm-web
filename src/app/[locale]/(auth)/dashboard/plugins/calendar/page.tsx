import { format } from 'date-fns';
import { getNow, getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { EventCalendar } from '@/components/showcase/plugins/EventCalendar';

export default async function CalendarPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CalendarPage' });
  // Server and browser start from the same day, so the sample events render identically.
  const today = format(await getNow({ locale }), 'yyyy-MM-dd');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <DemoCard title={t('card_title')} description={t('card_description')}>
        <EventCalendar today={today} />
      </DemoCard>
    </>
  );
}
