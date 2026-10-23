'use client';

import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A shell control's tooltip, beside it: what an icon on the rail or the strip does, and its
 * shortcut. Needs the shell's `TooltipProvider`.
 * @param props Component props.
 * @param props.label What it says.
 * @param props.side Where it shows: `right` (the rail and the strip, default) or `bottom`.
 * @param props.active Whether it may show (default true): a sidebar link writes its own name
 *   when the sidebar is expanded.
 * @param props.children The control.
 * @returns The control with its tooltip.
 */
export const ShellTip = (props: {
  label: React.ReactNode;
  side?: 'right' | 'bottom';
  active?: boolean;
  children: React.ReactElement;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open && props.active !== false} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent side={props.side ?? 'right'} sideOffset={6}>
        {props.label}
      </TooltipContent>
    </Tooltip>
  );
};
