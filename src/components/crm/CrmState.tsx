import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';

/**
 * A state that stands in for a page or a panel's content (an error, no access, nothing found) on
 * the page's own ground, as an empty list does: its icon on a tile (the danger tint for an error),
 * its title, one or two sentences on what happened and what to do, then the ways on.
 * @param props Component props.
 * @param props.icon Its icon.
 * @param props.danger Whether it is an error (the tile in the danger red).
 * @param props.title What happened.
 * @param props.heading Whether the title is the page's `h1` (it stands in for the page), else a
 *   paragraph.
 * @param props.text What to do about it.
 * @param props.role `alert` for an error that appears after the page did.
 * @param props.className Extra classes, such as its width.
 * @param props.children The ways on: links and buttons.
 * @returns The state.
 */
export const CrmState = (props: {
  icon: LucideIcon;
  danger?: boolean;
  title: React.ReactNode;
  heading?: boolean;
  text: React.ReactNode;
  role?: 'alert';
  className?: string;
  children?: React.ReactNode;
}) => {
  const Icon = props.icon;
  const Title = props.heading ? 'h1' : 'p';

  return (
    <div role={props.role} className={cn('flex flex-col items-start gap-4', props.className)}>
      <span
        aria-hidden="true"
        data-tone={props.danger ? 'red' : undefined}
        className={cn(
          'grid size-10 place-items-center rounded-lg',
          props.danger ? 'bg-(--tone-tint) text-(--tone-ink)' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <Title className="text-[1.25rem] leading-7 font-semibold tracking-[-0.01em] break-words">
          {props.title}
        </Title>
        <p className="max-w-[60ch] text-sm text-muted-foreground">{props.text}</p>
      </div>
      {props.children && <div className="flex flex-wrap gap-2">{props.children}</div>}
    </div>
  );
};
