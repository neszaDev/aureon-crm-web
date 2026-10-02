'use client';

import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Placement } from './data';

/**
 * A tooltip around any focusable trigger. It opens on hover and focus; with `openOnClick` a
 * click (or tap) opens it too; use it on buttons only, since it cancels the click's default.
 * @param props Component props.
 * @param props.content Tooltip text.
 * @param props.placement Side and alignment around the trigger.
 * @param props.defaultOpen Shows the tooltip on load.
 * @param props.openOnClick Also opens on click.
 * @param props.children The trigger (a button or link).
 * @returns The trigger and its tooltip.
 */
export const DemoTooltip = (props: {
  content: React.ReactNode;
  placement?: Placement;
  defaultOpen?: boolean;
  openOnClick?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(props.defaultOpen ?? false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        asChild
        onClick={(event) => {
          if (props.openOnClick) {
            // Keeps Radix from closing the tooltip on click, which it does by default.
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {props.children}
      </TooltipTrigger>
      <TooltipContent side={props.placement?.side} align={props.placement?.align} sideOffset={4}>
        {props.content}
      </TooltipContent>
    </Tooltip>
  );
};
