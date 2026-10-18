import { cn } from 'cn';
import { CircleAlertIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { components } from '@/libs/api/schema';
import { formatDate } from '@/libs/crm/Format';

type Lead = components['schemas']['LeadResponse'];

// The statuses a lead is still being worked in: a follow-up past its date is late only then.
const WORKED = new Set<Lead['status']>(['NEW', 'CONTACTED', 'QUALIFIED']);

/**
 * Tells whether a lead's follow-up is overdue: its date is before today, and the lead is still
 * being worked (a converted or unqualified lead has nothing to follow up).
 * @param lead The lead.
 * @param today Today in the workspace's time zone, `YYYY-MM-DD`.
 * @returns Whether it is overdue.
 */
export const isFollowUpOverdue = (lead: Pick<Lead, 'followUpDate' | 'status'>, today: string) =>
  lead.followUpDate !== undefined && lead.followUpDate < today && WORKED.has(lead.status);

/**
 * A lead's follow-up date as the same day in every time zone; an overdue one in crimson with the
 * word "Overdue", as a task's due time.
 * @param props Component props.
 * @param props.date The follow-up date, `YYYY-MM-DD`.
 * @param props.overdue Whether it is overdue.
 * @returns The date, or "No follow-up".
 */
export const LeadFollowUp = (props: { date?: string; overdue: boolean }) => {
  const t = useTranslations('LeadFollowUp');
  const locale = useLocale();
  if (!props.date) {
    return <span className="text-muted-foreground">{t('none')}</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex flex-wrap gap-x-1.5 tabular-nums',
        props.overdue && 'font-medium text-danger',
      )}
    >
      {props.overdue && (
        <span className="flex items-center gap-1">
          <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {t('overdue')}
        </span>
      )}
      {formatDate(props.date, locale)}
    </span>
  );
};
