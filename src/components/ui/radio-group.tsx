'use client';

import { cn } from 'cn';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import * as React from 'react';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid w-full gap-2', className)}
      {...props}
    />
  );
}

// Themed for Marksheet: a ply dot that fills folder green when chosen.
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input bg-ply shadow-ply outline-none group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-ink-400 focus-visible:border-folder focus-visible:ring-3 focus-visible:ring-folder/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-pen aria-invalid:ring-3 aria-invalid:ring-pen/15 aria-invalid:aria-checked:border-folder data-checked:border-folder data-checked:bg-folder data-checked:text-folder-ink group-has-[:focus-visible]/field-label:data-checked:border-folder',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-folder-ink" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
