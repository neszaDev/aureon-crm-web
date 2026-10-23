import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { addLead } from '@/actions/crm/LeadActions';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { LeadFilters } from '@/components/crm/lead/LeadFilters';
import { LeadTable } from '@/components/crm/lead/LeadTable';
import { InlineAddRow } from '@/components/crm/list/InlineAddRow';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
import type { ListGroup } from '@/components/crm/list/RecordList';
import { ownerSections, RecordList } from '@/components/crm/list/RecordList';
import { StatusPill } from '@/components/crm/StatusPill';
import { Button } from '@/components/ui/button';
import { getLeads, getLeadSources, getMembers, LEAD_LIST } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { groupQuery, ownerGroups, parseListQuery, pastEndHref } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import { LEAD_STATUS_TONES } from '@/libs/crm/StatusColors';
import { todayIn } from '@/libs/crm/ZonedTime';
import { Link, redirect } from '@/libs/I18nNavigation';
import { LEAD_STATUSES } from '@/validations/crm/LeadValidation';

type LeadsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// The statuses a lead added from the list can land in: Unqualified needs its reason, and only
// converting makes a lead Converted.
const ADDABLE = ['NEW', 'CONTACTED', 'QUALIFIED'] as const;

export async function generateMetadata(props: LeadsPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'LeadsPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function LeadsPage(props: LeadsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'LeadsPage' });
  const tStatus = await getTranslations({ locale, namespace: 'LeadStatus' });
  const query = parseListQuery(LEAD_LIST, await props.searchParams);
  const { status: statusFilter } = query.filters;

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, ungrouped, members, sources] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    query.group ? undefined : getLeads(workspaceId, query),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
  ]);
  if ([ungrouped, members, sources].some((result) => result?.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !sources.sources) {
    throw new Error('Could not load the leads');
  }
  // Grouped: each group is read on its own (its first rows and its total), all at once. By
  // status, those the status filter keeps, in their order; by owner, as the owner lists do.
  const statuses = LEAD_STATUSES.filter((status) => !statusFilter || statusFilter.includes(status));
  const owners = query.group === 'owner' ? ownerGroups(query, members.members, user.id) : [];
  let groups: ListGroup[] | undefined;
  let reads = [query];
  if (query.group === 'status') {
    groups = statuses.map((status) => ({
      key: status,
      title: <StatusPill tone={LEAD_STATUS_TONES[status]} label={tStatus(`status_${status}`)} />,
      params: { group: 'none', status },
    }));
    reads = statuses.map((status) =>
      groupQuery(query, { filters: { ...query.filters, status: [status] } }),
    );
  } else if (query.group === 'owner') {
    groups = ownerSections(owners, user.id, { group: 'none' });
    reads = owners.map((owner) => owner.query);
  }
  const lists = ungrouped
    ? [ungrouped]
    : await Promise.all(reads.map(async (read) => await getLeads(workspaceId, read)));
  if (lists.some((list) => list.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (lists.some((list) => list.forbidden)) {
    return <ForbiddenNotice page />;
  }
  if (lists.some((list) => !list.leads && !list.invalid)) {
    throw new Error('Could not load the leads');
  }
  const pages = lists.some((list) => list.invalid)
    ? undefined
    : lists.flatMap((list) => list.leads ?? []);
  const path = `/app/${workspace.id}/leads`;
  const last = pastEndHref(path, query, ungrouped?.leads);
  if (last) {
    return redirect({ href: last, locale });
  }
  const newLead = (
    <Button asChild>
      <Link href={`${path}/new`}>
        <PlusIcon data-icon="inline-start" />
        {t('new')}
      </Link>
    </Button>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <ListHeader
        title={t('title')}
        count={pages?.reduce((sum, item) => sum + item.totalElements, 0)}
        action={newLead}
      />

      <LeadFilters
        workspace={workspace}
        path={path}
        query={query}
        me={user}
        members={members.members}
        sources={sources.sources}
        timeZone={workspace.timezone}
      />

      {pages ? (
        <RecordList
          id="leads-heading"
          heading={(count) =>
            query.archived ? t('archived_heading', { count }) : t('list_heading', { count })
          }
          path={path}
          query={query}
          pages={pages}
          groups={groups}
          members={members.members}
          me={user.id}
          mayAssign={canAssign(workspace)}
          empty={{
            title: t('empty_title'),
            text: t('empty_text'),
            archivedText: t('archived_empty_text'),
            action: newLead,
          }}
          table={(rows) => (
            <LeadTable
              rows={rows}
              path={path}
              query={query}
              timeZone={workspace.timezone}
              today={todayIn(workspace.timezone)}
              workspace={workspace}
              me={user.id}
            />
          )}
          // A lead by its name and company, in the group's status (else the first one the status
          // filter keeps), for the group's or the filter's owner.
          addRow={(owner, key) => {
            const status = ADDABLE.find((item) =>
              query.group === 'status' ? item === key : statuses.includes(item),
            );
            if (!status) {
              return null;
            }
            let label = owner ? t('add_for', { name: owner.name }) : t('new');
            if (query.group === 'status') {
              label = t('add_in', { status: tStatus(`status_${status}`) });
            }
            return (
              <InlineAddRow
                label={label}
                placeholder={t('new')}
                extra={{ label: t('add_company'), placeholder: t('add_company_placeholder') }}
                action={addLead.bind(null, workspace.id, {
                  status,
                  ownerId: owner?.userId ?? null,
                })}
              />
            );
          }}
        />
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}
