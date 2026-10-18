import { useLocale, useTranslations } from 'next-intl';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import type { components } from '@/libs/api/schema';
import { formatDate, formatInstant } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

const linkClass = 'text-seal-ink';

/**
 * A deal's details as labelled rows: why it was lost (when it is), its company, contact, source
 * and lead as links, its probability (saying "from the stage" when it isn't its own), the
 * expected close date, when it closed, and the notes.
 * @param props Component props.
 * @param props.deal The deal.
 * @param props.workspaceId The workspace, which the links stay in.
 * @param props.timeZone The workspace's time zone, for when it closed.
 * @returns The panel.
 */
export const DealFacts = (props: {
  deal: components['schemas']['DealResponse'];
  workspaceId: number;
  timeZone: string;
}) => {
  const t = useTranslations('DealPage');
  const locale = useLocale();
  const { deal } = props;
  const base = `/app/${props.workspaceId}`;
  const lostReason = {
    label: t('lost_reason'),
    value: deal.lostReason && <span className="whitespace-pre-line">{deal.lostReason}</span>,
  };
  const closedOn = {
    label: t('closed_on'),
    value: deal.closedAt && formatInstant(deal.closedAt, { locale, timeZone: props.timeZone }),
  };
  const probability = new Intl.NumberFormat(locale, { style: 'percent' }).format(
    deal.probability / 100,
  );

  return (
    <RecordFacts
      label={t('details')}
      facts={[
        ...(deal.status === 'LOST' ? [lostReason] : []),
        {
          label: t('company'),
          value: deal.company && (
            <Link href={`${base}/companies/${deal.company.id}`} className={linkClass}>
              {deal.company.name}
            </Link>
          ),
        },
        {
          label: t('contact'),
          value: deal.contact && (
            <Link href={`${base}/contacts/${deal.contact.id}`} className={linkClass}>
              {deal.contact.fullName}
            </Link>
          ),
        },
        { label: t('source'), value: deal.source?.name },
        {
          label: t('lead'),
          value: deal.lead && (
            <Link href={`${base}/leads/${deal.lead.id}`} className={linkClass}>
              {deal.lead.fullName}
            </Link>
          ),
        },
        {
          label: t('probability'),
          // The deal's own, or else its stage's, which says so.
          value:
            deal.probabilityOverride === undefined
              ? `${probability} ${t('from_stage')}`
              : probability,
        },
        {
          label: t('expected_close'),
          value: deal.expectedCloseDate && formatDate(deal.expectedCloseDate, locale),
        },
        ...(deal.closedAt ? [closedOn] : []),
        {
          label: t('notes'),
          value: deal.notes && <span className="whitespace-pre-line">{deal.notes}</span>,
        },
      ]}
    />
  );
};
