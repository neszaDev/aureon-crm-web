'use client';

import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import * as React from 'react';

// Themed for Marksheet: a box on the white ply that fills folder green when checked.
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-ply shadow-ply transition-[background-color,border-color,box-shadow] outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-ink-400 focus-visible:border-folder focus-visible:ring-3 focus-visible:ring-folder/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-pen aria-invalid:ring-3 aria-invalid:ring-pen/15 aria-invalid:aria-checked:border-folder data-checked:border-folder data-checked:bg-folder data-checked:text-folder-ink group-has-[:focus-visible]/field-label:data-checked:border-folder',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
