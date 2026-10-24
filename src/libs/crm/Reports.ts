import { toRecordId } from './WorkspaceId';

/** The reports, in the order of the tabs; each is `?tab=<one of these>`. */
export const REPORT_TABS = ['pipeline', 'won-lost', 'funnel', 'activities', 'follow-ups'] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

// The reports the API answers for a period; the pipeline and the follow-ups are as of now.
const PERIOD_TABS = new Set<ReportTab>(['won-lost', 'funnel', 'activities']);

/**
 * Reads the tab from the URL: the first `?tab` that names a report, else the pipeline. A
 * hand-edited value never fails the page.
 * @param searchParams The page's search params.
 * @returns The tab to show.
 */
export const parseTab = (searchParams: Record<string, string | string[] | undefined>): ReportTab =>
  REPORT_TABS.find((tab) => tab === [searchParams.tab].flat()[0]) ?? 'pipeline';

/**
 * Tells whether a report follows the period picker.
 * @param tab The tab.
 * @returns Whether it takes a period.
 */
export const hasPeriod = (tab: ReportTab) => PERIOD_TABS.has(tab);

/**
 * Reads the member the reports count (`?ownerId`): the first value, when it is an id. A value that
 * is none is dropped, as a list's filter is, and the reports count the whole workspace; whether the
 * id is a current member is the API's to say (a 400 on `ownerId`).
 * @param searchParams The page's search params.
 * @returns The member's user id, or undefined.
 */
export const parseOwner = (searchParams: Record<string, string | string[] | undefined>) => {
  const [value] = [searchParams.ownerId].flat();

  return value === undefined ? undefined : toRecordId(value);
};

/**
 * The URL params a report's links keep beside its period: the tab, and the owner it counts.
 * @param tab The tab.
 * @param ownerId The owner, if any.
 * @returns The params.
 */
export const reportParams = (tab: ReportTab, ownerId?: number) => ({
  tab,
  ...(ownerId !== undefined && { ownerId: String(ownerId) }),
});
