import { cn } from 'cn';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Ref = components['schemas']['Ref'];
type PersonRef = components['schemas']['PersonRef'];

/**
 * The records a task or an activity is on, as links to their pages, the one being viewed left
 * out: its company, contact, lead and deal, in that order.
 * @param props Component props.
 * @param props.record The task or activity.
 * @param props.workspaceId The workspace.
 * @param props.viewed The record whose page this is, if any.
 * @param props.label Words before the links, such as "On".
 * @param props.className Extra classes for the list.
 * @returns The links, or nothing when there are none.
 */
export const LinkedRecords = (props: {
  record: { company?: Ref; contact?: PersonRef; lead?: PersonRef; deal?: Ref };
  workspaceId: number;
  viewed?: ActivityLink;
  label?: string;
  className?: string;
}) => {
  const { company, contact, lead, deal } = props.record;
  const viewed: Partial<Record<string, number>> = props.viewed ?? {};
  const links = [
    { key: 'companyId', path: 'companies', id: company?.id, label: company?.name },
    { key: 'contactId', path: 'contacts', id: contact?.id, label: contact?.fullName },
    { key: 'leadId', path: 'leads', id: lead?.id, label: lead?.fullName },
    { key: 'dealId', path: 'deals', id: deal?.id, label: deal?.name },
  ].filter((item) => item.id !== undefined && viewed[item.key] !== item.id);
  if (links.length === 0) {
    return null;
  }

  return (
    <span className={cn('flex flex-wrap gap-x-2', props.className)}>
      {props.label}
      {links.map((item) => (
        <Link
          key={item.key}
          href={`/app/${props.workspaceId}/${item.path}/${item.id}`}
          className="break-words text-violet-ink"
        >
          {item.label}
        </Link>
      ))}
    </span>
  );
};
