import { cn } from 'cn';
import * as React from 'react';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-20 w-full rounded-md border border-input px-3 py-2 text-base bg-field text-foreground shadow-ply transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 sm:text-[0.9375rem]',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
