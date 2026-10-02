import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CourseOptionPanel, OrganizationFilterPanel } from '@/components/campus/FilterPanels';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { listOrgUnits } from '@/libs/api/Queries';

export default async function CampusFiltersPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CampusFiltersPage' });
  const units = await listOrgUnits();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 xl:grid-cols-2">
        <DemoCard title={t('organization_title')} description={t('organization_description')}>
          <OrganizationFilterPanel units={units} />
        </DemoCard>
        <DemoCard title={t('option_title')} description={t('option_description')}>
          <CourseOptionPanel universities={units.organizations} />
        </DemoCard>
      </div>
    </>
  );
}
