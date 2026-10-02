import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { CountdownAlerts } from '@/components/showcase/notifications/CountdownAlerts';
import { DismissibleAlerts } from '@/components/showcase/notifications/DismissibleAlerts';
import { ALERT_TONES, ToneAlert } from '@/components/showcase/notifications/ToneAlert';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/libs/I18nNavigation';

export default async function AlertsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AlertsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 md:grid-cols-2">
        <DemoCard
          title={t('tones_title')}
          description={t('tones_description')}
          contentClassName="flex flex-col gap-3"
        >
          {ALERT_TONES.map((tone) => (
            <ToneAlert key={tone} tone={tone} live="off">
              {t('tone_alert', { tone: t(`tone_${tone}`) })}
            </ToneAlert>
          ))}
        </DemoCard>

        <DemoCard
          title={t('links_title')}
          description={t('links_description')}
          contentClassName="flex flex-col gap-3"
        >
          {ALERT_TONES.map((tone) => (
            <ToneAlert key={tone} tone={tone} live="off">
              {t.rich('tone_link', {
                tone: t(`tone_${tone}`),
                link: (chunks) => <Link href="/dashboard/test-results/">{chunks}</Link>,
              })}
            </ToneAlert>
          ))}
        </DemoCard>

        <DemoCard title={t('content_title')} description={t('content_description')}>
          <ToneAlert tone="pass" live="off" title={t('content_heading')}>
            <p>{t('content_body')}</p>
            <Separator className="my-3 bg-pass/30" />
            <p>{t('content_footer')}</p>
          </ToneAlert>
        </DemoCard>

        <div className="flex flex-col gap-8">
          <DemoCard title={t('dismissible_title')} description={t('dismissible_description')}>
            <DismissibleAlerts />
          </DemoCard>
          <DemoCard title={t('auto_title')} description={t('auto_description')}>
            <CountdownAlerts />
          </DemoCard>
        </div>
      </div>
    </>
  );
}
