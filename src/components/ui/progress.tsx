'use client';

import { cn } from 'cn';
import { Progress as ProgressPrimitive } from 'radix-ui';
import * as React from 'react';

// Themed for Marksheet: a folder-green fill on an ink-200 rule, square-cut like the cards.
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
        'relative flex h-1.5 w-full items-center overflow-x-hidden rounded-sm bg-ink-200',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-folder transition-transform duration-200"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
