import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Ref = components['schemas']['Ref'];
type PersonRef = components['schemas']['PersonRef'];

/**
 * The records a task or an activity is on, as links to their pages, the one being viewed left
 * out: its company, contact, lead and deal, in that order. With `more`, on one line, as a list
 * row has it: the first, cut short (whole in its tooltip), then "+N", a link to `more` whose
 * tooltip names them all (needs a `TooltipProvider`).
 * @param props Component props.
 * @param props.record The task or activity.
 * @param props.workspaceId The workspace.
 * @param props.viewed The record whose page this is, if any.
 * @param props.label Words before the links, such as "On".
 * @param props.more Where "+N" goes: the task's own page, which lists them all.
 * @param props.className Extra classes for the list.
 * @returns The links, or nothing when there are none.
 */
export const LinkedRecords = (props: {
  record: { company?: Ref; contact?: PersonRef; lead?: PersonRef; deal?: Ref };
  workspaceId: number;
  viewed?: ActivityLink;
  label?: string;
  more?: string;
  className?: string;
}) => {
  const t = useTranslations('LinkedRecords');
  const { company, contact, lead, deal } = props.record;
  const viewed: Partial<Record<string, number>> = props.viewed ?? {};
  const links = [
    { key: 'companyId', path: 'companies', id: company?.id, label: company?.name },
    { key: 'contactId', path: 'contacts', id: contact?.id, label: contact?.fullName },
    { key: 'leadId', path: 'leads', id: lead?.id, label: lead?.fullName },
    { key: 'dealId', path: 'deals', id: deal?.id, label: deal?.name },
  ].filter((item) => item.id !== undefined && viewed[item.key] !== item.id);
  const [first, ...rest] = links;
  if (!first) {
    return null;
  }
  const link = (item: typeof first, className: string) => (
    <Link
      key={item.key}
      href={`/app/${props.workspaceId}/${item.path}/${item.id}`}
      title={props.more ? item.label : undefined}
      className={cn('text-violet-ink', className)}
    >
      {item.label}
    </Link>
  );

  if (props.more) {
    return (
      <span className={cn('flex min-w-0 items-baseline gap-1.5', props.className)}>
        {link(first, 'truncate')}
        {rest.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={props.more}
                aria-label={t('more', {
                  count: rest.length,
                  names: rest.map((item) => item.label).join(', '),
                })}
                className="shrink-0 rounded-full bg-muted px-1.5 text-xs leading-5 font-medium text-ink-2 tabular-nums no-underline hover:text-foreground"
              >
                {`+${rest.length}`}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="flex flex-col">
                {links.map((item) => (
                  <span key={item.key}>{item.label}</span>
                ))}
              </span>
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    );
  }

  return (
    <span className={cn('flex flex-wrap gap-x-2', props.className)}>
      {props.label}
      {links.map((item) => link(item, 'break-words'))}
    </span>
  );
};
