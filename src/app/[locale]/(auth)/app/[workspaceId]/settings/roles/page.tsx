import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RolesMatrix } from '@/components/crm/settings/RolesMatrix';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { getWorkspace } from '@/libs/api/CrmQueries';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';

type RolesPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

const RULES = ['owners', 'last_owner', 'leave', 'own_records'] as const;

export async function generateMetadata(props: RolesPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RolesPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function RolesPage(props: RolesPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'RolesPage' });
  // The layout has loaded the workspace (a cached call) and handled its failures.
  const { workspace } = await getWorkspace(workspaceId);

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <section
        aria-labelledby="matrix-heading"
        className="overflow-hidden rounded-lg border border-rule bg-card"
      >
        <h2 id="matrix-heading" className="px-5 pt-4 pb-2 font-semibold">
          {t('matrix_heading')}
        </h2>
        <RolesMatrix current={workspace?.role} />
      </section>
      <section
        aria-labelledby="rules-heading"
        className="rounded-lg border border-rule bg-card px-5 py-4"
      >
        <h2 id="rules-heading" className="font-semibold">
          {t('rules_heading')}
        </h2>
        <ul className="mt-2 flex max-w-[70ch] list-disc flex-col gap-1.5 pl-5 text-[0.9375rem] marker:text-seal-ink">
          {RULES.map((rule) => (
            <li key={rule}>{t(`rule_${rule}`)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
