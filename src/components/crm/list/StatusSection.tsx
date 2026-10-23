import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';

/**
 * One group of a grouped list: a heading that is also the collapse button (its caret, what heads
 * the group, its count), then the group's rows. A group with more rows than it shows ends with a
 * link to all of them.
 * @param props Component props.
 * @param props.title What heads the group: a status pill, or an owner (`OwnerTitle`).
 * @param props.count How many records the group holds (the API's total), or a lower bound such as
 *   "8+" where the API sends only the first few.
 * @param props.countLabel The count in words, read out, such as "3 companies".
 * @param props.closed Whether it starts folded.
 * @param props.viewAll The link to all of the group's records, when it shows only some.
 * @param props.viewAll.href The list filtered to the group.
 * @param props.viewAll.label Its text, such as "View all 51".
 * @param props.children The rows, and the row that adds one.
 * @returns The group.
 */
export const StatusSection = (props: {
  title: React.ReactNode;
  count: number | string;
  countLabel: string;
  closed?: boolean;
  viewAll?: { href: string; label: string };
  children: React.ReactNode;
}) => (
  <Collapsible defaultOpen={!props.closed} className="flex flex-col">
    <h3 className="flex">
      <CollapsibleTrigger className="group/section -ml-1.5 flex h-9 max-w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-sm font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=closed]/section:-rotate-90 motion-reduce:transition-none"
        />
        {props.title}{' '}
        <span aria-hidden="true" className="font-medium text-muted-foreground tabular-nums">
          {props.count}
        </span>
        <span className="sr-only">{props.countLabel}</span>
      </CollapsibleTrigger>
    </h3>
    <CollapsibleContent className="border-t border-rule">
      {props.children}
      {props.viewAll && (
        <Link
          href={props.viewAll.href}
          className="flex h-9 items-center px-3 text-[0.8125rem] font-medium text-violet-ink"
        >
          {props.viewAll.label}
        </Link>
      )}
    </CollapsibleContent>
  </Collapsible>
);

/**
 * What heads an owner's group: their avatar and name, or the dashed ring of "Unassigned". A long
 * name is cut short, whole in its tooltip.
 * @param props Component props.
 * @param props.member The owner; none for the unassigned records.
 * @returns The title.
 */
export const OwnerTitle = (props: { member?: components['schemas']['MemberResponse'] }) => {
  const t = useTranslations('RecordList');
  const name = props.member ? (props.member.displayName ?? props.member.email) : t('unassigned');

  return (
    <span className="flex min-w-0 items-center gap-2">
      <PersonAvatar person={props.member} size="xs" />
      <span title={name} className="truncate">
        {name}
      </span>
    </span>
  );
};
