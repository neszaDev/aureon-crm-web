'use client';

import { use, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Placement } from './data';

type LazyNode = { $$typeof: symbol; _payload: PromiseLike<React.ReactNode> };

/**
 * Tells whether a node is a lazy element whose payload can be unwrapped with `use()`: what a
 * server component child (such as next-intl's `Link`) can arrive as, sometimes nested. The same
 * test as Radix's Slot, which checks that the payload is a thenable.
 * @param node The node.
 * @returns Whether it is lazy.
 */
const isLazy = (node: unknown): node is LazyNode =>
  typeof node === 'object' &&
  node !== null &&
  '$$typeof' in node &&
  node.$$typeof === Symbol.for('react.lazy') &&
  '_payload' in node &&
  typeof node._payload === 'object' &&
  node._payload !== null &&
  'then' in node._payload;

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
  // Radix's Slot unwraps one lazy level only and throws on a nested one: unwrap them all, so the
  // trigger it clones is the element itself.
  let trigger = props.children;
  while (isLazy(trigger)) {
    trigger = use(trigger._payload);
  }

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
        {trigger}
      </TooltipTrigger>
      <TooltipContent side={props.placement?.side} align={props.placement?.align} sideOffset={4}>
        {props.content}
      </TooltipContent>
    </Tooltip>
  );
};
