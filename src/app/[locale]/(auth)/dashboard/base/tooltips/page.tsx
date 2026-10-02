import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { PLACEMENTS } from '@/components/showcase/base/data';
import { DemoTooltip } from '@/components/showcase/base/DemoTooltip';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link } from '@/libs/I18nNavigation';

export default async function TooltipsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TooltipsPage' });
  const tPlace = await getTranslations({ locale, namespace: 'BasePlacements' });

  return (
    <TooltipProvider delayDuration={150}>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('basic_title')} description={t('basic_description')}>
        <div className="grid grid-cols-2 gap-4 py-3">
          <div className="flex justify-center">
            <DemoTooltip content={t('basic_content')} openOnClick>
              <Button variant="secondary">{t('hover_me')}</Button>
            </DemoTooltip>
          </div>
          <div className="flex justify-center">
            <DemoTooltip content={t('open_content')} defaultOpen>
              <Button variant="secondary">{t('hover_me')}</Button>
            </DemoTooltip>
          </div>
        </div>
        <p className="mt-4 text-ink-700">
          {t.rich('link_sentence', {
            link: (chunks) => (
              <DemoTooltip content={t('link_content')}>
                <Link
                  href="/dashboard/test-results/"
                  className="font-semibold text-folder underline"
                >
                  {chunks}
                </Link>
              </DemoTooltip>
            ),
          })}
        </p>
      </DemoCard>

      <DemoCard title={t('placement_title')} description={t('placement_description')}>
        <div className="grid gap-2 py-3 sm:grid-cols-2 md:grid-cols-3">
          {PLACEMENTS.map((placement) => {
            const name = tPlace(`${placement.side}_${placement.align}`);
            return (
              <div key={name} className="flex justify-center py-4">
                <DemoTooltip
                  content={t('placement_content', { placement: name })}
                  placement={placement}
                >
                  <Button>{name}</Button>
                </DemoTooltip>
              </div>
            );
          })}
        </div>
      </DemoCard>
    </TooltipProvider>
  );
}
