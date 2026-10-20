import { Seal } from '@/components/crm/Seal';
import type { components } from '@/libs/api/schema';

/**
 * A member in a report: their seal and their name (the email without one). Without a member (a
 * report's entry for deals or tasks nobody holds) it is `none` and no seal, since a seal is only
 * ever someone's; a blank of the seal's size keeps the words in line with the names above.
 * @param props Component props.
 * @param props.member The member, if any.
 * @param props.none What to say without one.
 * @returns The member.
 */
export const ReportMember = (props: {
  member?: components['schemas']['MemberRef'];
  none: string;
}) => (
  <span className="flex min-w-0 items-center gap-2">
    {props.member ? (
      <Seal size="sm" name={props.member.displayName} email={props.member.email} />
    ) : (
      <span aria-hidden="true" className="size-6 shrink-0" />
    )}
    <span className={props.member ? 'min-w-0 break-words' : 'text-muted-foreground'}>
      {props.member ? (props.member.displayName ?? props.member.email) : props.none}
    </span>
  </span>
);
