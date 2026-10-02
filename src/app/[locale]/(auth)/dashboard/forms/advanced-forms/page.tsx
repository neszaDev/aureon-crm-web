import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { PopoverDatePickers, RangeCalendarDemo } from '@/components/showcase/forms/DatePickers';
import { DocsLink } from '@/components/showcase/forms/DocsLink';
import { MaskedInputs } from '@/components/showcase/forms/MaskedInputs';
import { MultiselectDemo, SelectDemo } from '@/components/showcase/forms/SelectDemos';

export default async function AdvancedFormsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdvancedFormsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <DemoCard
          title={t('masked_title')}
          description={t('masked_description')}
          action={
            <DocsLink
              href="https://imask.js.org/guide.html"
              label={t('docs')}
              title={t('docs_title', { library: 'IMask' })}
            />
          }
        >
          <MaskedInputs />
        </DemoCard>

        <div className="flex flex-col gap-8">
          <DemoCard
            title={t('multiselect_title')}
            description={t('multiselect_description')}
            action={
              <DocsLink
                href="https://cmdk.paco.me"
                label={t('docs')}
                title={t('docs_title', { library: 'cmdk' })}
              />
            }
          >
            <MultiselectDemo />
          </DemoCard>

          <DemoCard title={t('select_title')} description={t('select_description')}>
            <SelectDemo />
          </DemoCard>

          <DemoCard
            title={t('date_picker_title')}
            description={t('date_picker_description')}
            action={
              <DocsLink
                href="https://daypicker.dev"
                label={t('docs')}
                title={t('docs_title', { library: 'React DayPicker' })}
              />
            }
            contentClassName="flex flex-col gap-6"
          >
            <RangeCalendarDemo />
            <PopoverDatePickers />
          </DemoCard>
        </div>
      </div>
    </>
  );
}
