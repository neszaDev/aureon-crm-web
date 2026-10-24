'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A shell control's tooltip, beside it: what an icon on the rail does, and its shortcut. Needs the
 * shell's `TooltipProvider`.
 * @param props Component props.
 * @param props.label What it says.
 * @param props.side Where it shows: `right` (the rail, default) or `bottom`.
 * @param props.children The control.
 * @returns The control with its tooltip.
 */
export const ShellTip = (props: {
  label: React.ReactNode;
  side?: 'right' | 'bottom';
  children: React.ReactElement;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{props.children}</TooltipTrigger>
    <TooltipContent side={props.side ?? 'right'} sideOffset={6}>
      {props.label}
    </TooltipContent>
  </Tooltip>
);
