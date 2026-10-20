import { setRequestLocale } from 'next-intl/server';
import { SettingsNav } from '@/components/crm/settings/SettingsNav';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { can } from '@/libs/crm/Permissions';

export default async function SettingsLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string; workspaceId: string }>;
}) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  // A cached call: the workspace layout loaded it.
  const { workspace } = await getOpenWorkspace(locale, workspaceId);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 xl:grid xl:grid-cols-[12rem_minmax(0,1fr)] xl:items-start xl:gap-10">
      <SettingsNav
        workspaceId={workspaceId}
        audit={workspace !== undefined && can(workspace, 'AUDIT_READ')}
      />
      <div className="flex min-w-0 flex-col gap-5">{props.children}</div>
    </div>
  );
}
