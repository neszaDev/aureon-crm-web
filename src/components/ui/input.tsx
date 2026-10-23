import { cn } from 'cn';
import * as React from 'react';
import { fieldStates, fieldSurface } from '@/components/ui/field-surface';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldSurface,
        fieldStates,
        'h-9 w-full min-w-0 px-2.5 py-1 placeholder:text-muted-foreground sm:h-8 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
