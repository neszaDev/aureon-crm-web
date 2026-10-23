import { useTranslations } from 'next-intl';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import { OwnerTitle, StatusSection } from '@/components/crm/list/StatusSection';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { isFiltered, listHref } from '@/libs/crm/ListQuery';

type Member = components['schemas']['MemberResponse'];

/** Whom the row that adds a record gives it to: a group's owner, or the list's owner filter's. */
export type AddOwner = { userId: number; name: string };

/**
 * A list page's records under their heading (read out, not drawn: the page header shows the
 * count). Ungrouped: the page of rows, the row that adds one, and the pager. Grouped by owner: a
 * collapsible section per group that has records, its first rows, the row that adds one, and
 * "View all N" when it holds more; the caller's own section shows even when empty, for its add row.
 * Without records, the empty state: nothing matches the search and filters (clearing them keeps
 * the grouping and the sort), the archive is empty, or nothing yet (with the create action). The add row shows only where
 * the new record lands in view: not in the archive, nor under Unassigned (a new record is always
 * someone's), nor for an owner the caller may not give records to.
 * @param props Component props.
 * @param props.id The heading's id.
 * @param props.heading The count in words, such as "3 companies".
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.pages The page read, or one per group.
 * @param props.groups The groups, in the order of `pages`; none when ungrouped.
 * @param props.members The workspace's members.
 * @param props.me The caller's user id.
 * @param props.mayAssign Whether the caller may give records to others (`RECORDS_ASSIGN`).
 * @param props.empty What the empty states say.
 * @param props.empty.title Nothing yet: what is missing, such as "No companies yet".
 * @param props.empty.text Nothing yet: what to do about it.
 * @param props.empty.archivedText An empty archive: what shows there.
 * @param props.empty.action Nothing yet: the create button.
 * @param props.table The rows, as the entity's table.
 * @param props.addRow The row that adds a record, for an owner (none: the caller).
 * @returns The list.
 */
export const RecordList = <Row,>(props: {
  id: string;
  heading: (count: number) => string;
  path: string;
  query: ListQuery;
  pages: { content: Row[]; totalElements: number }[];
  groups?: { member?: Member; params: { ownerId: string } }[];
  members: Member[];
  me: number;
  mayAssign: boolean;
  empty: { title: string; text: string; archivedText: string; action: React.ReactNode };
  table: (rows: Row[]) => React.ReactNode;
  addRow: (owner?: AddOwner) => React.ReactElement;
}) => {
  const t = useTranslations('ListToolbar');
  const total = props.pages.reduce((sum, page) => sum + page.totalElements, 0);
  const add = (member?: Member) =>
    !props.query.archived &&
    (member === undefined || member.userId === props.me || props.mayAssign) &&
    props.addRow(member && { userId: member.userId, name: member.displayName ?? member.email });
  const [page] = props.pages;
  let empty = (
    <ListEmpty
      variant="none"
      title={props.empty.title}
      text={props.empty.text}
      action={props.empty.action}
    />
  );
  if (isFiltered(props.query)) {
    // The search and filters go; the grouping and the sort stay.
    const { group, sort, direction } = props.query.params;
    empty = (
      <ListEmpty
        variant="filtered"
        clearHref={listHref(props.path, { params: {} }, { group, sort, direction })}
      />
    );
  } else if (props.query.archived) {
    empty = (
      <ListEmpty
        variant="archived"
        text={props.empty.archivedText}
        activeHref={listHref(props.path, props.query, { archived: undefined })}
      />
    );
  }

  return (
    <section aria-labelledby={props.id} className="flex flex-col gap-5">
      <h2 id={props.id} className="sr-only">
        {props.heading(total)}
      </h2>
      {total === 0 && empty}
      {!props.groups && page && page.content.length > 0 && (
        <div>
          {props.table(page.content)}
          {!props.query.unassigned &&
            add(props.members.find((item) => String(item.userId) === props.query.params.ownerId))}
          <ListPager path={props.path} query={props.query} total={page.totalElements} />
        </div>
      )}
      {props.groups?.map((group, index) => {
        const rows = props.pages[index];
        // The caller's own group stays, empty too, for the row that adds one of theirs.
        const addRow = group.member && add(group.member);
        if (!rows || (!rows.totalElements && !(addRow && group.member?.userId === props.me))) {
          return null;
        }
        return (
          <StatusSection
            key={group.params.ownerId}
            title={<OwnerTitle member={group.member} />}
            count={rows.totalElements}
            countLabel={props.heading(rows.totalElements)}
            viewAll={
              rows.totalElements > rows.content.length
                ? {
                    href: listHref(props.path, props.query, { group: undefined, ...group.params }),
                    label: t('view_all', { count: rows.totalElements }),
                  }
                : undefined
            }
          >
            {rows.content.length > 0 && props.table(rows.content)}
            {addRow}
          </StatusSection>
        );
      })}
    </section>
  );
};
