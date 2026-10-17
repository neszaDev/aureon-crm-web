import { cn } from 'cn';
import { initialsOf } from '@/components/crm/Seal';

/**
 * A workspace as a square chop with its initials: the seal's shape for organisations, the
 * circle being for people. Decorative: the name is always written next to it.
 * @param props Component props.
 * @param props.name Workspace name.
 * @param props.tone `rail` on the vermilion rail, `paper` (default) on paper and menus.
 * @param props.className Extra classes (size).
 * @returns The mark.
 */
export const WorkspaceMark = (props: {
  name: string;
  tone?: 'rail' | 'paper';
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-grid size-8 shrink-0 place-items-center rounded-md border-2 text-xs leading-none font-bold select-none',
      props.tone === 'rail' ? 'border-on-seal text-on-seal' : 'border-seal-ink text-seal-ink',
      props.className,
    )}
  >
    {initialsOf(props.name, '')}
  </span>
);
