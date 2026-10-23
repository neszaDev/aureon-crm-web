import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RolesMatrix } from '@/components/crm/settings/RolesMatrix';
import { SettingsHeader, SettingsSection } from '@/components/crm/settings/SettingsHeader';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
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
  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const { workspace } = await getOpenWorkspace(locale, workspaceId);

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <SettingsSection headingId="matrix-heading" title={t('matrix_heading')}>
        <RolesMatrix current={workspace?.role} />
      </SettingsSection>
      <SettingsSection headingId="rules-heading" title={t('rules_heading')}>
        <ul className="flex max-w-[70ch] list-disc flex-col gap-1.5 pl-5 text-sm marker:text-violet-ink">
          {RULES.map((rule) => (
            <li key={rule}>{t(`rule_${rule}`)}</li>
          ))}
        </ul>
      </SettingsSection>
    </>
  );
}
