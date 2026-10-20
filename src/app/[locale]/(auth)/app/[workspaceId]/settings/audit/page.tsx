import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuditTrail } from '@/components/crm/audit/AuditTrail';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { getAuditEvents, getMembers, getWorkspace } from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';
import { AUDIT_LIST } from '@/libs/crm/Audit';
import { listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { can } from '@/libs/crm/Permissions';
import { redirect } from '@/libs/I18nNavigation';

type AuditPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: AuditPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AuditPage' });
  const { workspace } = await getWorkspace(workspaceId);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: t('title'),
    forbidden: workspace !== undefined && !can(workspace, 'AUDIT_READ'),
  });
}

export default async function AuditPage(props: AuditPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AuditPage' });
  const query = parseListQuery(AUDIT_LIST, await props.searchParams);

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const { workspace } = await getOpenWorkspace(locale, workspaceId);
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  // The whole trail needs AUDIT_READ: without it the backend refuses, so don't ask.
  if (!can(workspace, 'AUDIT_READ')) {
    return <ForbiddenNotice page />;
  }
  const [list, members] = await Promise.all([
    getAuditEvents(workspaceId, { ...query.filters, page: query.page, size: query.size }),
    getMembers(workspaceId),
  ]);
  if (list.unauthorized || members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (list.forbidden) {
    return <ForbiddenNotice page />;
  }
  if ((!list.events && !list.invalid) || !members.members) {
    throw new Error('Could not load the audit trail');
  }
  const path = `/app/${workspace.id}/settings/audit`;
  const page = list.events;
  // A page past the end (a hand-edited link): the last one instead.
  if (page && page.content.length === 0 && page.totalPages > 0) {
    return redirect({
      href: listHref(path, query, {
        page: page.totalPages > 1 ? String(page.totalPages - 1) : undefined,
      }),
      locale,
    });
  }

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <AuditTrail
        events={page}
        workspace={workspace}
        members={members.members}
        path={path}
        query={query}
      />
    </>
  );
}
