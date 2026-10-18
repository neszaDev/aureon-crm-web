import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';
import * as React from 'react';

// Themed for Aureon: the seal fills the primary action, outlines sit on the white field.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-ply hover:bg-seal-deep',
        outline:
          'border-input bg-field text-foreground shadow-ply hover:border-muted-foreground hover:bg-accent aria-expanded:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-border',
        ghost: 'text-foreground hover:bg-accent aria-expanded:bg-accent',
        // Dark crimson is too light to carry white text, so dark mode tints instead of filling;
        // light tints keep its text at 4.5:1 or more on paper and field, hover included (18%: 4.67:1).
        destructive:
          'bg-destructive text-white shadow-ply hover:bg-destructive/90 focus-visible:ring-destructive dark:bg-destructive/12 dark:text-destructive dark:shadow-none dark:hover:bg-destructive/18',
        link: 'h-auto px-0 text-seal-ink underline-offset-4 hover:underline',
        // For the boilerplate demo's folder-green fields.
        inverse:
          'bg-folder-ink text-folder shadow-ply hover:bg-white focus-visible:ring-folder-ink focus-visible:ring-offset-folder',
        'inverse-ghost':
          'text-folder-ink hover:bg-white/10 focus-visible:ring-folder-ink focus-visible:ring-offset-folder',
      },
      size: {
        default: 'h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 gap-2 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-9',
        'icon-xs': "size-7 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
