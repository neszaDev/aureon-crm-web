import { cn } from 'cn';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-sm bg-ink-200/70 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

export { Skeleton };
