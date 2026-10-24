import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';

/**
 * A contact's tag as a small outlined badge, in sentence case (DESIGN.md's label rule; the
 * primitive's uppercase is the demos'). A long tag wraps rather than being cut, unless the caller
 * cuts it (a list row's one line), whole in its tooltip.
 * @param props Component props.
 * @param props.tag The tag.
 * @param props.className Extra classes, such as cutting it short.
 * @returns The badge.
 */
export const TagBadge = (props: { tag: string; className?: string }) => (
  <Badge
    variant="outline"
    title={props.tag}
    className={cn(
      'h-auto min-h-6 max-w-full text-xs font-medium tracking-normal break-all whitespace-normal normal-case',
      props.className,
    )}
  >
    {props.tag}
  </Badge>
);
