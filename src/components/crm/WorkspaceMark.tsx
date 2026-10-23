import { cn } from 'cn';
import { initialsOf } from '@/libs/crm/Format';

/**
 * A workspace as its avatar: a violet square with its initials (people's avatars are round).
 * Decorative: the name is always written next to it.
 * @param props Component props.
 * @param props.name Workspace name.
 * @param props.className Extra classes (size).
 * @returns The mark.
 */
export const WorkspaceMark = (props: { name: string; className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-grid size-8 shrink-0 place-items-center rounded-md bg-violet text-xs leading-none font-semibold text-white select-none',
      props.className,
    )}
  >
    {initialsOf(props.name, '')}
  </span>
);
