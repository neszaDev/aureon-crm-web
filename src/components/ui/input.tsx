import { cn } from 'cn';
import * as React from 'react';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-input px-3 py-2 text-base bg-ply text-ink-900 shadow-ply transition-[border-color,box-shadow] outline-none placeholder:text-ink-400 hover:border-ink-400 focus-visible:border-folder focus-visible:ring-3 focus-visible:ring-folder/20 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:opacity-60 aria-invalid:border-pen aria-invalid:ring-3 aria-invalid:ring-pen/15 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium sm:text-[0.9375rem]',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
