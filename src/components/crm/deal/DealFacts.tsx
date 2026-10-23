import {
  AlignLeftIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarIcon,
  CircleSlashIcon,
  MegaphoneIcon,
  PercentIcon,
  UserIcon,
  UserPlusIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import type { components } from '@/libs/api/schema';
import { formatDate, formatInstant } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

const linkClass = 'text-seal-ink';

/**
 * A deal's properties, icon-labelled: why it was lost (when it is), its company, contact, source
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
  const base = `/app/${props.workspaceId}`;
  const lostReason = {
    icon: CircleSlashIcon,
    label: t('lost_reason'),
    value: props.deal.lostReason && (
      <span className="whitespace-pre-line">{props.deal.lostReason}</span>
    ),
  };
  const closedOn = {
    icon: CalendarCheckIcon,
    label: t('closed_on'),
    value:
      props.deal.closedAt &&
      formatInstant(props.deal.closedAt, { locale, timeZone: props.timeZone }),
  };
  const probability = new Intl.NumberFormat(locale, { style: 'percent' }).format(
    props.deal.probability / 100,
  );

  return (
    <RecordFacts
      label={t('details')}
      facts={[
        ...(props.deal.status === 'LOST' ? [lostReason] : []),
        {
          icon: Building2Icon,
          label: t('company'),
          value: props.deal.company && (
            <Link href={`${base}/companies/${props.deal.company.id}`} className={linkClass}>
              {props.deal.company.name}
            </Link>
          ),
        },
        {
          icon: UserIcon,
          label: t('contact'),
          value: props.deal.contact && (
            <Link href={`${base}/contacts/${props.deal.contact.id}`} className={linkClass}>
              {props.deal.contact.fullName}
            </Link>
          ),
        },
        { icon: MegaphoneIcon, label: t('source'), value: props.deal.source?.name },
        {
          icon: UserPlusIcon,
          label: t('lead'),
          value: props.deal.lead && (
            <Link href={`${base}/leads/${props.deal.lead.id}`} className={linkClass}>
              {props.deal.lead.fullName}
            </Link>
          ),
        },
        {
          icon: PercentIcon,
          label: t('probability'),
          // The deal's own, or else its stage's, which says so.
          value:
            props.deal.probabilityOverride === undefined
              ? `${probability} ${t('from_stage')}`
              : probability,
        },
        {
          icon: CalendarIcon,
          label: t('expected_close'),
          value: props.deal.expectedCloseDate && formatDate(props.deal.expectedCloseDate, locale),
        },
        ...(props.deal.closedAt ? [closedOn] : []),
        {
          icon: AlignLeftIcon,
          label: t('notes'),
          value: props.deal.notes && (
            <span className="whitespace-pre-line">{props.deal.notes}</span>
          ),
        },
      ]}
    />
  );
};
