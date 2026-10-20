import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { ReportMember } from '@/components/crm/reports/ReportMember';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';

// The member's column stays in view while the rest scrolls on a phone; a long name wraps there.
const MEMBER = 'sticky left-0 z-10 max-w-56 min-w-44 bg-card px-4 whitespace-normal sm:px-5';
const COLUMNS = ['calls', 'emails', 'meetings', 'notes', 'tasksCompleted'] as const;

/**
 * What each member did in the period, as the API counted it: calls, emails, meetings and notes
 * they logged and the tasks they completed, one row each in the API's order (most in total
 * first), the members who left together as "Former members". A row's total is the five counts
 * added, the sum the API orders by; no column is added up, and nothing is left out. On a phone
 * the table scrolls inside its own region, which the keyboard can reach.
 * @param props Component props.
 * @param props.report The activities report.
 * @returns The panel.
 */
export const ActivityReport = (props: { report: components['schemas']['ActivityReport'] }) => {
  const t = useTranslations('ActivityReport');
  const number = new Intl.NumberFormat(useLocale());

  return (
    <Panel id="activity" title={t('title')}>
      <p className="px-4 pb-3 text-[0.8125rem] text-muted-foreground sm:px-5">{t('scope')}</p>
      {props.report.byUser.length > 0 ? (
        // Seven columns do not fit a phone: the table scrolls in its own region, which takes the
        // focus so the keyboard can scroll it too.
        <section
          aria-label={t('table')}
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must take the focus (WCAG 2.1.1)
          tabIndex={0}
          className="flex overflow-x-auto border-t border-rule outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <table className="w-full min-w-[34rem] shrink-0 text-sm">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className={MEMBER}>
                  {t('member')}
                </TableHead>
                {COLUMNS.map((column) => (
                  <TableHead scope="col" key={column} className="text-right">
                    {t(`col_${column}`)}
                  </TableHead>
                ))}
                <TableHead scope="col" className="px-4 text-right sm:px-5">
                  {t('total')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.report.byUser.map((entry) => (
                // One entry per member, and one for the members who left: no user id.
                <TableRow key={entry.user?.userId ?? 'former'}>
                  <TableHead
                    scope="row"
                    className={cn(MEMBER, 'text-sm font-medium text-foreground')}
                  >
                    <ReportMember member={entry.user} none={t('former')} />
                  </TableHead>
                  {COLUMNS.map((column) => (
                    <TableCell key={column} className="text-right tabular-nums">
                      {number.format(entry[column])}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 text-right font-semibold tabular-nums sm:px-5">
                    {number.format(COLUMNS.reduce((sum, column) => sum + entry[column], 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
          {/* While columns are hidden past the right edge, it fades there (global.css). */}
          <div
            aria-hidden="true"
            className="pointer-events-none sticky right-0 -ml-10 w-10 shrink-0 scroll-fade self-stretch [--fade-to:var(--card)]"
          />
        </section>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
    </Panel>
  );
};
