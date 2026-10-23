import { cn } from 'cn';
import * as React from 'react';
import { fieldStates, fieldSurface } from '@/components/ui/field-surface';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldSurface,
        fieldStates,
        'flex field-sizing-content min-h-20 w-full px-2.5 py-1.5 placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
