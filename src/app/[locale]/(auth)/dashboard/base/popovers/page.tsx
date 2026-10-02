import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { PLACEMENTS } from '@/components/showcase/base/data';
import { DemoPopover } from '@/components/showcase/base/DemoPopover';
import { DemoCard } from '@/components/showcase/DemoCard';

export default async function PopoversPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PopoversPage' });
  const tPlace = await getTranslations({ locale, namespace: 'BasePlacements' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('basic_title')} description={t('basic_description')}>
        <div className="grid grid-cols-2 gap-4 py-3">
          <div className="flex justify-center">
            <DemoPopover label={t('click_me')} title={t('basic_header')}>
              {t('basic_content')}
            </DemoPopover>
          </div>
          <div className="flex justify-center">
            <DemoPopover label={t('click_me')} title={t('open_header')} defaultOpen>
              {t.rich('open_content', { strong: (chunks) => <strong>{chunks}</strong> })}
            </DemoPopover>
          </div>
        </div>
      </DemoCard>

      <DemoCard title={t('placement_title')} description={t('placement_description')}>
        <div className="grid gap-2 py-3 sm:grid-cols-2 md:grid-cols-3">
          {PLACEMENTS.map((placement) => {
            const name = tPlace(`${placement.side}_${placement.align}`);
            return (
              <div key={name} className="flex justify-center py-4">
                <DemoPopover label={name} title={t('placement_header')} placement={placement}>
                  {t('placement_content', { placement: name })}
                </DemoPopover>
              </div>
            );
          })}
        </div>
      </DemoCard>
    </>
  );
}
