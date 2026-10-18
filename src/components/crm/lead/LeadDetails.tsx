import { useLocale, useTranslations } from 'next-intl';
import { isFollowUpOverdue, LeadFollowUp } from '@/components/crm/lead/LeadFollowUp';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import type { components } from '@/libs/api/schema';
import { formatInstant, formatMoney } from '@/libs/crm/Format';
import { todayIn } from '@/libs/crm/ZonedTime';

/**
 * A lead's details as labelled rows: email and phone as links, job title, company name, source,
 * priority, follow-up date (an overdue one in crimson), estimated value, notes, and when it was
 * converted. A fact without a value reads "Not set".
 * @param props Component props.
 * @param props.lead The lead.
 * @param props.timeZone The workspace's time zone: "today" for the follow-up, and the conversion
 *   time.
 * @returns The panel.
 */
export const LeadDetails = (props: {
  lead: components['schemas']['LeadResponse'];
  timeZone: string;
}) => {
  const t = useTranslations('LeadPage');
  const tStatus = useTranslations('LeadStatus');
  const locale = useLocale();
  const { lead } = props;

  return (
    <RecordFacts
      label={t('details')}
      facts={[
        {
          label: t('email'),
          // Encoded: a stored address can hold `?subject=…`, which must not fill in a message.
          value: lead.email && (
            <a
              href={`mailto:${encodeURIComponent(lead.email)}`}
              className="break-all text-seal-ink"
            >
              {lead.email}
            </a>
          ),
        },
        {
          label: t('phone'),
          value: lead.phone && (
            <a
              href={`tel:${lead.phone.replaceAll(/\s/gu, '')}`}
              className="text-seal-ink tabular-nums"
            >
              {lead.phone}
            </a>
          ),
        },
        { label: t('job_title'), value: lead.jobTitle },
        { label: t('company'), value: lead.companyName },
        { label: t('source'), value: lead.source?.name },
        { label: t('priority'), value: tStatus(`priority_${lead.priority}`) },
        {
          label: t('follow_up'),
          value: lead.followUpDate && (
            <LeadFollowUp
              date={lead.followUpDate}
              overdue={isFollowUpOverdue(lead, todayIn(props.timeZone))}
            />
          ),
        },
        {
          label: t('estimated_value'),
          value: lead.estimatedValue && lead.currency && (
            <span className="tabular-nums">
              {formatMoney(lead.estimatedValue, lead.currency, locale)}
            </span>
          ),
        },
        {
          label: t('notes'),
          value: lead.notes && <span className="whitespace-pre-line">{lead.notes}</span>,
        },
        ...(lead.convertedAt
          ? [
              {
                label: t('converted_on'),
                value: formatInstant(lead.convertedAt, {
                  locale,
                  timeZone: props.timeZone,
                  withTime: true,
                }),
              },
            ]
          : []),
      ]}
    />
  );
};
