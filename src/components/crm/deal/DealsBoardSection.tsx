import { getLocale, getTranslations } from 'next-intl/server';
import { DealBoard } from '@/components/crm/deal/DealBoard';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import type { DEAL_LIST } from '@/libs/api/CrmQueries';
import { getBoard } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import type { ListQuery } from '@/libs/crm/ListQuery';

/**
 * The deals page's board: it loads the board for the page's search, owner and company, and shows
 * the columns, or what stands in for them when there are no deals (nothing matches, or nothing
 * yet), or the notice for a query the backend refused.
 * @param props Component props.
 * @param props.workspace The workspace, with the caller's permissions.
 * @param props.me The caller's user id.
 * @param props.query The page's list query.
 * @param props.path The deals page's path.
 * @param props.newDeal The "New deal" button, for the empty board.
 * @returns The board.
 */
export const DealsBoardSection = async (props: {
  workspace: components['schemas']['WorkspaceResponse'];
  me: number;
  query: ListQuery<typeof DEAL_LIST>;
  path: string;
  newDeal: React.ReactNode;
}) => {
  const t = await getTranslations('DealsPage');
  const board = await getBoard(String(props.workspace.id), props.query);
  if (board.unauthorized) {
    return endRejectedSession(await getLocale());
  }
  if (board.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (board.invalid) {
    return <InvalidFilterNotice resetHref={props.path} />;
  }
  const columns = board.board?.stages;
  if (!columns) {
    throw new Error('Could not load the deal board');
  }
  if (columns.some((column) => column.count > 0)) {
    return (
      <DealBoard
        workspaceId={props.workspace.id}
        columns={columns}
        me={props.me}
        permissions={props.workspace.permissions}
        path={props.path}
        query={props.query}
        now={new Date()}
        timeZone={props.workspace.timezone}
      />
    );
  }
  // The board takes only the search, the owner and the company.
  const filtered = [
    props.query.q,
    props.query.unassigned,
    props.query.filters.ownerId,
    props.query.filters.companyId,
  ].some((value) => value !== undefined);

  return (
    <section
      aria-label={t('title')}
      className="overflow-hidden rounded-lg border border-rule bg-card"
    >
      {filtered ? (
        <ListEmpty variant="filtered" clearHref={props.path} />
      ) : (
        <ListEmpty
          variant="none"
          title={t('empty_title')}
          text={t('empty_text')}
          action={props.newDeal}
        />
      )}
    </section>
  );
};
