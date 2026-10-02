'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Placement } from './data';

/**
 * A button that opens a popover with a title and a line of content. One that starts open keeps
 * the focus where it is, so the page does not scroll to it on load.
 * @param props Component props.
 * @param props.label Button text.
 * @param props.title Popover title.
 * @param props.children Popover content.
 * @param props.placement Side and alignment around the button.
 * @param props.defaultOpen Opens the popover on load.
 * @returns The trigger and its popover.
 */
export const DemoPopover = (props: {
  label: string;
  title: string;
  children: React.ReactNode;
  placement?: Placement;
  defaultOpen?: boolean;
}) => (
  <Popover defaultOpen={props.defaultOpen}>
    <PopoverTrigger asChild>
      <Button>{props.label}</Button>
    </PopoverTrigger>
    <PopoverContent
      side={props.placement?.side}
      align={props.placement?.align}
      className="w-60"
      onOpenAutoFocus={(event) => {
        if (props.defaultOpen) {
          event.preventDefault();
        }
      }}
    >
      <PopoverHeader>
        <PopoverTitle className="font-semibold text-ink-950">{props.title}</PopoverTitle>
        <PopoverDescription>{props.children}</PopoverDescription>
      </PopoverHeader>
    </PopoverContent>
  </Popover>
);
