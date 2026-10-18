import { useTranslations } from 'next-intl';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import type { components } from '@/libs/api/schema';
import { recordNumber } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

const none = (text: string) => <span className="text-muted-foreground">{text}</span>;

/**
 * What a lead was converted into: its company, its contact and its deal, as the lead's page and
 * the Convert dialog both show them. The company and the deal are the ones the conversion linked
 * or created, if any.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.company The company, if any.
 * @param props.contact The contact.
 * @param props.deal The deal, if one was made.
 * @returns The panel.
 */
export const ConversionSummary = (props: {
  workspaceId: number;
  company?: components['schemas']['Ref'];
  contact?: components['schemas']['PersonRef'];
  deal?: components['schemas']['Ref'];
}) => {
  const t = useTranslations('ConversionSummary');
  const base = `/app/${props.workspaceId}`;

  return (
    <RecordFacts
      label={t('label')}
      facts={[
        {
          label: t('company'),
          value: props.company ? (
            <Link href={`${base}/companies/${props.company.id}`} className="text-seal-ink">
              {props.company.name}
            </Link>
          ) : (
            none(t('no_company'))
          ),
        },
        {
          label: t('contact'),
          value: props.contact && (
            <Link href={`${base}/contacts/${props.contact.id}`} className="text-seal-ink">
              {props.contact.fullName}
            </Link>
          ),
        },
        {
          label: t('deal'),
          // The deal's page ships with the deals (Task 6): until then it is named, not linked.
          value: props.deal ? (
            <span className="flex flex-wrap items-baseline gap-x-2">
              {props.deal.name}
              <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                {recordNumber('deal', props.deal.id)}
              </span>
            </span>
          ) : (
            none(t('no_deal'))
          ),
        },
      ]}
    />
  );
};
