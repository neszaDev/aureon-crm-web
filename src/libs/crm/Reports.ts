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
