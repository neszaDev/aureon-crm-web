import { getLocale, getTranslations } from 'next-intl/server';
import { DealTable } from '@/components/crm/deal/DealTable';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InlineAddRow } from '@/components/crm/list/InlineAddRow';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import type { ListGroup } from '@/components/crm/list/RecordList';
import { ownerSections, RecordList } from '@/components/crm/list/RecordList';
import { StatusPill } from '@/components/crm/StatusPill';
import type { DEAL_LIST } from '@/libs/api/CrmQueries';
import { getDeals } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { groupQuery, isFiltered, listHref, ownerGroups, pastEndHref } from '@/libs/crm/ListQuery';
import { canAssign } from '@/libs/crm/RecordAccess';
import { stageTone } from '@/libs/crm/StatusColors';
import { redirect } from '@/libs/I18nNavigation';

/**
 * The link to the create form from a group of the deal list: the stage it starts in and the owner
 * it is for, filled in.
 * @param path The deals page's path.
 * @param stageId The group's open stage, if any.
 * @param ownerId The group's or the filter's owner, if any.
 * @returns The link.
 */
const newDealHref = (path: string, stageId?: number, ownerId?: number) => {
  const prefill = new URLSearchParams();
  if (stageId !== undefined) {
    prefill.set('stageId', String(stageId));
  }
  if (ownerId !== undefined) {
    prefill.set('ownerId', String(ownerId));
  }
  const text = prefill.toString();

  return text ? `${path}/new?${text}` : `${path}/new`;
};

/**
 * The deals page's list: by stage (the default: every stage of the pipeline in order, then Won
 * and Lost, each headed by its pill), by owner, or ungrouped with its pager. A group is read on
 * its own, at most 50 rows with the API's total, and links to all of its deals past that. Each
 * open stage's group ends with a row that opens the create form in that stage. Without rows, what
 * stands in for them (nothing matches, the archive is empty, or nothing yet), or the notice for a
 * query the backend refused. A page past the end (a hand-edited link, or deals archived
 * meanwhile) goes to the last one.
 * @param props Component props.
 * @param props.workspace The workspace, with its time zone and the caller's permissions.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @param props.stages The pipeline's stages, in order.
 * @param props.query The page's list query.
 * @param props.path The deals page's path.
 * @param props.newDeal The "Add deal" button, for the empty list.
 * @returns The list.
 */
export const DealsListSection = async (props: {
  workspace: components['schemas']['WorkspaceResponse'];
  me: number;
  members: components['schemas']['MemberResponse'][];
  stages: components['schemas']['StageResponse'][];
  query: ListQuery<typeof DEAL_LIST>;
  path: string;
  newDeal: React.ReactNode;
}) => {
  const t = await getTranslations('DealsPage');
  const tTable = await getTranslations('DealTable');
  const locale = await getLocale();
  const { query } = props;
  const workspaceId = String(props.workspace.id);
  const stageRefs = props.stages.map(({ id, name, kind }) => ({ id, name, kind }));
  // By stage: those the stage and status filters keep, in pipeline order.
  const stages = stageRefs.filter(
    (stage) =>
      (query.filters.stageId === undefined || stage.id === query.filters.stageId) &&
      (query.filters.status === undefined || stage.kind === query.filters.status),
  );
  const owners = query.group === 'owner' ? ownerGroups(query, props.members, props.me) : [];
  let groups: ListGroup[] | undefined;
  let reads = [query];
  if (query.group === 'stage') {
    groups = stages.map((stage) => ({
      key: String(stage.id),
      title: (
        <StatusPill
          tone={stageTone(stageRefs, stage.id)}
          label={stage.name}
          field={tTable('stage')}
        />
      ),
      params: { group: 'none', stageId: String(stage.id) },
    }));
    reads = stages.map((stage) =>
      groupQuery(query, { filters: { ...query.filters, stageId: stage.id } }),
    );
  } else if (query.group === 'owner') {
    groups = ownerSections(owners, props.me, { group: 'none' });
    reads = owners.map((owner) => owner.query);
  }
  const lists = await Promise.all(reads.map(async (read) => await getDeals(workspaceId, read)));
  if (lists.some((list) => list.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (lists.some((list) => list.forbidden)) {
    return <ForbiddenNotice page />;
  }
  // Without its search and filters, but still the list.
  const listPath = listHref(props.path, { params: {} }, { view: 'list' });
  if (lists.some((list) => list.invalid)) {
    return <InvalidFilterNotice resetHref={listPath} />;
  }
  const pages = lists.flatMap((list) => list.deals ?? []);
  if (pages.length < lists.length) {
    throw new Error('Could not load the deals');
  }
  const last = pastEndHref(props.path, query, query.group ? undefined : pages[0]);
  if (last) {
    return redirect({ href: last, locale });
  }
  const { group, sort, direction } = query.params;

  return (
    <RecordList
      id="deals-heading"
      heading={(count) =>
        query.archived ? t('archived_heading', { count }) : t('list_heading', { count })
      }
      path={props.path}
      query={query}
      pages={pages}
      groups={groups}
      members={props.members}
      me={props.me}
      mayAssign={canAssign(props.workspace)}
      empty={{
        title: t('empty_title'),
        text: t('empty_text'),
        archivedText: t('archived_empty_text'),
        action: props.newDeal,
        // `view` narrows nothing, and clearing keeps the list.
        filtered: isFiltered<typeof DEAL_LIST>({
          ...query,
          filters: { ...query.filters, view: undefined },
        }),
        clearHref: listHref(props.path, { params: {} }, { view: 'list', group, sort, direction }),
      }}
      table={(rows) => (
        <DealTable
          rows={rows}
          path={props.path}
          companiesPath={`/app/${props.workspace.id}/companies`}
          query={query}
          timeZone={props.workspace.timezone}
          stages={stageRefs}
          workspace={props.workspace}
          me={props.me}
        />
      )}
      // The create form, in the group's stage when it is open (a deal starts in one), for the
      // group's or the filter's owner.
      addRow={(owner, key) => {
        const stage =
          query.group === 'stage' ? stageRefs.find((item) => String(item.id) === key) : undefined;
        if (stage && stage.kind !== 'OPEN') {
          return null;
        }
        let label = owner ? t('add_for', { name: owner.name }) : t('new');
        if (stage) {
          label = t('add_in', { stage: stage.name });
        }
        return (
          <InlineAddRow label={label} href={newDealHref(props.path, stage?.id, owner?.userId)} />
        );
      }}
    />
  );
};
