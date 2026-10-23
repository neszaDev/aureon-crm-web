import { cn } from 'cn';
import { initialsOf } from '@/components/crm/PersonAvatar';

const SIZES = {
  sm: 'size-6 border-[1.5px] text-[0.6875rem]',
  md: 'size-8 border-2 text-xs',
  lg: 'size-10 border-2 text-sm',
};

/**
 * A person as a round ink seal with their initials. Superseded by `PersonAvatar`; kept until the
 * rework's later tasks are done, then deleted.
 * @param props Component props.
 * @param props.name Display name; the initials come from it when set.
 * @param props.email Email address; the initials come from it without a name.
 * @param props.size `sm` (24 px), `md` (32 px, default) or `lg` (40 px).
 * @param props.title Accessible name; without it the seal is decorative and hidden.
 * @returns The seal.
 */
export const Seal = (props: {
  name?: string;
  email: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}) => (
  <span
    role={props.title ? 'img' : undefined}
    aria-label={props.title}
    aria-hidden={props.title ? undefined : true}
    title={props.title}
    className={cn(
      'inline-grid shrink-0 place-items-center rounded-full border-seal-ink bg-field leading-none font-bold text-seal-ink select-none',
      SIZES[props.size ?? 'md'],
    )}
  >
    {initialsOf(props.name, props.email)}
  </span>
);
