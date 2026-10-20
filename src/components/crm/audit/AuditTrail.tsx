import { useTranslations } from 'next-intl';
import { AuditEventItem } from '@/components/crm/audit/AuditEventItem';
import { FilterSelect } from '@/components/crm/list/FilterSelect';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import type { components } from '@/libs/api/schema';
import type { AUDIT_LIST } from '@/libs/crm/Audit';
import { AUDIT_ENTITY_TYPES } from '@/libs/crm/Audit';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { isFiltered } from '@/libs/crm/ListQuery';

type Schemas = components['schemas'];

/**
 * The workspace's audit trail (Settings → Audit): the filters, by the kind of record and by who
 * did it (a member, or "Former member" for someone who left), then a page of events, newest
 * first, each a sentence with what changed, and the pager. The filters and the paging are in the
 * URL.
 * @param props Component props.
 * @param props.events The page of events, or undefined when the backend refused the filters.
 * @param props.workspace The workspace: its id, for the links, and its time zone.
 * @param props.members The workspace's members, for the "Done by" filter.
 * @param props.path The page's path.
 * @param props.query The page's query.
 * @returns The filters and the list.
 */
export const AuditTrail = (props: {
  events?: Pick<Schemas['PageAuditEventResponse'], 'content' | 'totalElements'>;
  workspace: Pick<Schemas['WorkspaceResponse'], 'id' | 'timezone'>;
  members: Schemas['MemberResponse'][];
  path: string;
  query: ListQuery<typeof AUDIT_LIST>;
}) => {
  const t = useTranslations('AuditTrail');
  const { events } = props;
  let list = <InvalidFilterNotice resetHref={props.path} />;
  if (events) {
    let rows = isFiltered(props.query) ? (
      <ListEmpty variant="filtered" clearHref={props.path} />
    ) : (
      <ListEmpty variant="none" title={t('empty_title')} text={t('empty_text')} />
    );
    if (events.content.length > 0) {
      rows = (
        <>
          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops the list role */}
          <ul role="list">
            {events.content.map((event) => (
              <AuditEventItem key={event.id} event={event} workspace={props.workspace} />
            ))}
          </ul>
          <ListPager path={props.path} query={props.query} total={events.totalElements} />
        </>
      );
    }
    list = (
      <section
        aria-labelledby="audit-heading"
        className="overflow-hidden rounded-lg border border-rule bg-card"
      >
        <h2 id="audit-heading" className="px-4 pt-4 pb-3 font-semibold sm:px-5">
          {t('heading', { count: events.totalElements })}
        </h2>
        {rows}
      </section>
    );
  }

  return (
    <>
      <ListToolbar label={t('toolbar_label')}>
        <FilterSelect
          id="audit-entity"
          label={t('entity_label')}
          anyLabel={t('entity_any')}
          // Every valid type is an option: the URL can't hold one this misses.
          missingLabel={t('entity_any')}
          param="entityType"
          options={AUDIT_ENTITY_TYPES.map((type) => ({
            value: type,
            label: t(`entity_${type}`),
          }))}
          path={props.path}
          query={props.query}
        />
        <FilterSelect
          id="audit-actor"
          label={t('actor_label')}
          anyLabel={t('actor_any')}
          missingLabel={t('actor_former')}
          param="actorId"
          options={props.members.map((member) => ({
            value: String(member.userId),
            label: member.displayName ?? member.email,
            person: member,
          }))}
          path={props.path}
          query={props.query}
        />
      </ListToolbar>
      {list}
    </>
  );
};
