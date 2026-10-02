import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import * as React from 'react';

// Themed for Marksheet: a card-face note with an ink-200 rule; destructive is a pen-tinted box.
const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-sm border border-ink-200 px-3 py-2.5 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-paper-card text-ink-900 shadow-sheet',
        // Like FormAlert: a pen-tinted box, never a loud red fill.
        destructive:
          'border-pen/30 bg-pen/[0.06] text-pen *:data-[slot=alert-description]:text-pen/90 *:[svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-semibold text-current group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm text-balance text-ink-600 md:text-pretty [&_a]:text-folder [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4',
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="alert-action" className={cn('absolute top-2 right-2', className)} {...props} />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
