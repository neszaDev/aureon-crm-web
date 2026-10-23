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

/** A section of a grouped list: what heads it, and what narrows the list to it. */
export type ListGroup = {
  key: string;
  /** What heads it: a status pill, or an owner (`OwnerTitle`). */
  title: React.ReactNode;
  /** Its filter as URL params: "View all" is the list with them. */
  params: Record<string, string | undefined>;
  /**
   * Whom a record added here belongs to: its owner, none for Unassigned (no add row there: a new
   * record is always someone's), or, left out, the list's owner filter's.
   */
  member?: Member | null;
  /** Shown even without records, for its add row (the caller's own group). */
  keep?: boolean;
  /** Folded at first (closed tasks). */
  closed?: boolean;
};

/**
 * A list's groups by owner as its sections: each headed by the owner, the caller's kept when
 * empty.
 * @param groups The owner groups (`ownerGroups`).
 * @param me The caller's user id.
 * @param params What "View all" adds besides the owner: `group=none` on a list grouped by default.
 * @returns The sections.
 */
export const ownerSections = (
  groups: { member?: Member; params: { ownerId: string } }[],
  me: number,
  params: Record<string, string> = {},
): ListGroup[] =>
  groups.map((group) => ({
    key: group.params.ownerId,
    title: <OwnerTitle member={group.member} />,
    params: { ...params, ...group.params },
    member: group.member ?? null,
    keep: group.member?.userId === me,
  }));

/**
 * A list page's records under their heading (read out, not drawn: the page header shows the
 * count). Ungrouped: the page of rows, the row that adds one, and the pager. Grouped: a
 * collapsible section per group that has records (and the one `keep` names), its first rows, the
 * row that adds one, and "View all N" when it holds more. Without records, the empty state:
 * nothing matches the search and filters (clearing them keeps the grouping and the sort), the
 * archive is empty, or nothing yet (with the create action). The add row shows only where the new
 * record lands in view: not in the archive, nor under Unassigned, nor for an owner the caller may
 * not give records to; `addRow` may leave out a group of its own (a status no record starts in).
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
 * @param props.empty.filtered Whether the list is narrowed, when not by its query's filters alone
 *   (the deals' `view` narrows nothing).
 * @param props.empty.clearHref The list without its search and filters, when it keeps more than
 *   the grouping and the sort.
 * @param props.table The rows, as the entity's table.
 * @param props.addRow The row that adds a record, for an owner (none: the caller) and a group.
 * @returns The list.
 */
export const RecordList = <Row,>(props: {
  id: string;
  heading: (count: number) => string;
  path: string;
  query: ListQuery;
  pages: { content: Row[]; totalElements: number }[];
  groups?: ListGroup[];
  members: Member[];
  me: number;
  mayAssign: boolean;
  empty: {
    title: string;
    text: string;
    archivedText: string;
    action: React.ReactNode;
    filtered?: boolean;
    clearHref?: string;
  };
  table: (rows: Row[]) => React.ReactNode;
  addRow: (owner?: AddOwner, group?: string) => React.ReactElement | null;
}) => {
  const t = useTranslations('ListToolbar');
  const total = props.pages.reduce((sum, page) => sum + page.totalElements, 0);
  // The owner filter's member (tasks: the assignee's).
  const { ownerId, assigneeId, group, sort, direction } = props.query.params;
  const filterOwner = props.members.find((item) => String(item.userId) === (ownerId ?? assigneeId));
  const add = (member?: Member, key?: string) =>
    !props.query.archived &&
    (member === undefined || member.userId === props.me || props.mayAssign) &&
    props.addRow(
      member && { userId: member.userId, name: member.displayName ?? member.email },
      key,
    );
  const [page] = props.pages;
  let empty = (
    <ListEmpty
      variant="none"
      title={props.empty.title}
      text={props.empty.text}
      action={props.empty.action}
    />
  );
  if (props.empty.filtered ?? isFiltered(props.query)) {
    empty = (
      <ListEmpty
        variant="filtered"
        // The search and filters go; the grouping and the sort stay.
        clearHref={
          props.empty.clearHref ?? listHref(props.path, { params: {} }, { group, sort, direction })
        }
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
      {/* It takes the focus when a row leaves with it (a task completed out of its section). */}
      <h2 id={props.id} tabIndex={-1} className="sr-only">
        {props.heading(total)}
      </h2>
      {total === 0 && empty}
      {!props.groups && page && page.content.length > 0 && (
        <div>
          {props.table(page.content)}
          {!props.query.unassigned && add(filterOwner)}
          <ListPager path={props.path} query={props.query} total={page.totalElements} />
        </div>
      )}
      {props.groups?.map((item, index) => {
        const rows = props.pages[index];
        const addRow =
          item.member !== null &&
          !(item.member === undefined && props.query.unassigned) &&
          add(item.member ?? filterOwner, item.key);
        if (!rows || (!rows.totalElements && !(item.keep && addRow))) {
          return null;
        }
        return (
          <StatusSection
            key={item.key}
            title={item.title}
            count={rows.totalElements}
            countLabel={props.heading(rows.totalElements)}
            closed={item.closed}
            viewAll={
              rows.totalElements > rows.content.length
                ? {
                    href: listHref(props.path, props.query, { group: undefined, ...item.params }),
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
