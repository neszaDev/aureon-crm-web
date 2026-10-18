import { getLocale, getTranslations } from 'next-intl/server';
import { DealTable } from '@/components/crm/deal/DealTable';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import type { DEAL_LIST } from '@/libs/api/CrmQueries';
import { getDeals } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import { isFiltered, listHref } from '@/libs/crm/ListQuery';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { redirect } from '@/libs/I18nNavigation';

/**
 * The deals page's table: it loads a page of deals for the search, filters and sort, and shows
 * it with its pager, or what stands in for rows (nothing matches, the archive is empty, or
 * nothing yet), or the notice for a query the backend refused. A page past the end (a
 * hand-edited link, or deals archived meanwhile) goes to the last one.
 * @param props Component props.
 * @param props.workspace The workspace, with its time zone.
 * @param props.query The page's list query.
 * @param props.path The deals page's path.
 * @param props.newDeal The "New deal" button, for the empty list.
 * @returns The table.
 */
export const DealsListSection = async (props: {
  workspace: components['schemas']['WorkspaceResponse'];
  query: ListQuery<typeof DEAL_LIST>;
  path: string;
  newDeal: React.ReactNode;
}) => {
  const t = await getTranslations('DealsPage');
  const locale = await getLocale();
  const list = await getDeals(String(props.workspace.id), props.query);
  if (list.unauthorized) {
    return endRejectedSession(locale);
  }
  if (list.forbidden) {
    return <ForbiddenNotice page />;
  }
  // Without its search and filters, but still the table.
  const listPath = listHref(props.path, { params: {} }, { view: 'list' });
  if (list.invalid) {
    return <InvalidFilterNotice resetHref={listPath} />;
  }
  const rows = list.deals;
  if (!rows) {
    throw new Error('Could not load the deals');
  }
  if (rows.content.length === 0 && rows.totalPages > 0) {
    return redirect({
      href: listHref(props.path, props.query, {
        page: rows.totalPages > 1 ? String(rows.totalPages - 1) : undefined,
      }),
      locale,
    });
  }
  // `view` narrows nothing.
  const filtered = isFiltered({
    ...props.query,
    filters: { ...props.query.filters, view: undefined },
  });
  let empty = (
    <ListEmpty
      variant="none"
      title={t('empty_title')}
      text={t('empty_text')}
      action={props.newDeal}
    />
  );
  if (filtered) {
    empty = <ListEmpty variant="filtered" clearHref={listPath} />;
  } else if (props.query.archived) {
    empty = (
      <ListEmpty
        variant="archived"
        text={t('archived_empty_text')}
        activeHref={listHref(props.path, props.query, { archived: undefined })}
      />
    );
  }

  return (
    <section
      aria-labelledby="deals-heading"
      className="overflow-hidden rounded-lg border border-rule bg-card"
    >
      <h2 id="deals-heading" className="px-4 pt-4 pb-3 font-semibold sm:px-5">
        {props.query.archived
          ? t('archived_heading', { count: rows.totalElements })
          : t('list_heading', { count: rows.totalElements })}
      </h2>
      {rows.content.length > 0 ? (
        <>
          <div className="border-t border-rule">
            <DealTable
              rows={rows.content}
              path={props.path}
              companiesPath={`/app/${props.workspace.id}/companies`}
              query={props.query}
              timeZone={props.workspace.timezone}
            />
          </div>
          <ListPager path={props.path} query={props.query} total={rows.totalElements} />
        </>
      ) : (
        empty
      )}
    </section>
  );
};
