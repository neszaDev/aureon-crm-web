import { cn } from 'cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { initialsOf } from '@/libs/crm/Format';

const SIZES = {
  xs: 'size-5 text-[0.6875rem]',
  sm: 'size-6 text-[0.6875rem]',
  md: 'size-8 text-xs',
};

/**
 * One of the eight avatar colours (`--avatar-1` to `-8`), the same for a member everywhere: by
 * their id, or by their email for someone who isn't a member yet.
 * @param key The member's id, or an email.
 * @returns The colour, as a CSS value.
 */
const colourOf = (key: number | string) => {
  const hash =
    typeof key === 'number'
      ? key
      : Array.from(key, (char) => char.codePointAt(0) ?? 0).reduce(
          (sum, code) => (sum * 31 + code) % 2_147_483_647,
          0,
        );

  return `var(--avatar-${(Math.abs(hash) % 8) + 1})`;
};

/**
 * A person as a round avatar: their initials in white on their colour. Without a person it is
 * the dashed ring of "unassigned".
 * @param props Component props.
 * @param props.person The member (a `MemberRef` fits), if any.
 * @param props.size `xs` (20 px), `sm` (24 px) or `md` (32 px, default).
 * @param props.title Their full name (or "Unassigned") when nothing beside the avatar says it:
 *   it becomes an image of that name, with the name in a tooltip. Without it the avatar is
 *   decorative and hidden.
 * @returns The avatar.
 */
export const PersonAvatar = (props: {
  person?: { userId?: number; displayName?: string; email?: string };
  size?: keyof typeof SIZES;
  title?: string;
}) => {
  const avatar = (
    <span
      role={props.title ? 'img' : undefined}
      aria-label={props.title}
      aria-hidden={props.title ? undefined : true}
      data-slot="person-avatar"
      style={
        props.person
          ? { backgroundColor: colourOf(props.person.userId ?? props.person.email ?? '') }
          : undefined
      }
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full leading-none font-semibold select-none',
        props.person ? 'text-white' : 'border border-dashed border-input',
        SIZES[props.size ?? 'md'],
      )}
    >
      {props.person && initialsOf(props.person.displayName, props.person.email ?? '')}
    </span>
  );

  if (!props.title) {
    return avatar;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent>{props.title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
