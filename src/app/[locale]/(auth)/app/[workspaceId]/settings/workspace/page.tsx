import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updateWorkspace } from '@/actions/crm/WorkspaceActions';
import { currencyOptions } from '@/components/crm/CreateWorkspaceForm';
import { SettingsHeader, SettingsSection } from '@/components/crm/settings/SettingsHeader';
import { WorkspaceForm } from '@/components/crm/WorkspaceForm';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { can } from '@/libs/crm/Permissions';
import { TIME_ZONES } from '@/validations/crm/WorkspaceValidation';

type WorkspaceSettingsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export async function generateMetadata(props: WorkspaceSettingsPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'WorkspaceSettingsPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function WorkspaceSettingsPage(props: WorkspaceSettingsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'WorkspaceSettingsPage' });
  const tForm = await getTranslations({ locale, namespace: 'WorkspaceForm' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const { workspace } = await getOpenWorkspace(locale, workspaceId);
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const values = {
    name: workspace.name,
    defaultCurrency: workspace.defaultCurrency,
    timezone: workspace.timezone,
  };
  const currencyName = new Intl.DisplayNames(locale, { type: 'currency' }).of(
    values.defaultCurrency,
  );

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <SettingsSection headingId="workspace-heading" title={t('details_heading')}>
        <div className="max-w-2xl">
          {can(workspace, 'WORKSPACE_MANAGE') ? (
            <WorkspaceForm
              action={updateWorkspace.bind(null, workspace.id, workspace.version)}
              currencies={currencyOptions(locale)}
              timeZones={TIME_ZONES}
              defaults={values}
              submitLabel={t('save')}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <dl className="flex flex-col gap-4">
                {[
                  { label: tForm('name_label'), value: values.name },
                  {
                    label: tForm('currency_label'),
                    value: `${values.defaultCurrency} · ${currencyName ?? values.defaultCurrency}`,
                  },
                  { label: tForm('timezone_label'), value: values.timezone.replaceAll('_', ' ') },
                ].map((fact) => (
                  <div key={fact.label} className="grid gap-0.5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <dt className="text-[0.8125rem] text-muted-foreground sm:pt-0.5">
                      {fact.label}
                    </dt>
                    <dd className="font-semibold break-words">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">{t('read_only')}</p>
            </div>
          )}
        </div>
      </SettingsSection>
    </>
  );
}
