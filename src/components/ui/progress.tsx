'use client';

import { cn } from 'cn';
import { Progress as ProgressPrimitive } from 'radix-ui';
import * as React from 'react';

// Themed for Aureon: a violet fill on the hairline rule, square-cut like the panels.
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        'relative flex h-1.5 w-full items-center overflow-x-hidden rounded-sm bg-border',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-transform duration-200"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
