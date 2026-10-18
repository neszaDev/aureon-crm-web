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
        'h-10 w-full min-w-0 px-3 py-2 placeholder:text-muted-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
