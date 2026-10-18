import { Badge } from '@/components/ui/badge';

/**
 * A contact's tag as a small outlined badge, in sentence case (DESIGN.md's label rule; the
 * primitive's uppercase is the demos'). A long tag wraps rather than being cut.
 * @param props Component props.
 * @param props.tag The tag.
 * @returns The badge.
 */
export const TagBadge = (props: { tag: string }) => (
  <Badge
    variant="outline"
    className="h-auto min-h-6 max-w-full text-xs font-medium tracking-normal break-all whitespace-normal normal-case"
  >
    {props.tag}
  </Badge>
);
