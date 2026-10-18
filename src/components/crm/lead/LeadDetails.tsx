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

  return (
    <RecordFacts
      label={t('details')}
      facts={[
        {
          label: t('email'),
          // Encoded: a stored address can hold `?subject=…`, which must not fill in a message.
          value: props.lead.email && (
            <a
              href={`mailto:${encodeURIComponent(props.lead.email)}`}
              className="break-all text-seal-ink"
            >
              {props.lead.email}
            </a>
          ),
        },
        {
          label: t('phone'),
          value: props.lead.phone && (
            <a
              href={`tel:${props.lead.phone.replaceAll(/\s/gu, '')}`}
              className="text-seal-ink tabular-nums"
            >
              {props.lead.phone}
            </a>
          ),
        },
        { label: t('job_title'), value: props.lead.jobTitle },
        { label: t('company'), value: props.lead.companyName },
        { label: t('source'), value: props.lead.source?.name },
        { label: t('priority'), value: tStatus(`priority_${props.lead.priority}`) },
        {
          label: t('follow_up'),
          value: props.lead.followUpDate && (
            <LeadFollowUp
              date={props.lead.followUpDate}
              overdue={isFollowUpOverdue(props.lead, todayIn(props.timeZone))}
            />
          ),
        },
        {
          label: t('estimated_value'),
          value: props.lead.estimatedValue && props.lead.currency && (
            <span className="tabular-nums">
              {formatMoney(props.lead.estimatedValue, props.lead.currency, locale)}
            </span>
          ),
        },
        {
          label: t('notes'),
          value: props.lead.notes && (
            <span className="whitespace-pre-line">{props.lead.notes}</span>
          ),
        },
        ...(props.lead.convertedAt
          ? [
              {
                label: t('converted_on'),
                value: formatInstant(props.lead.convertedAt, {
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
