import { cn } from 'cn';
import { MoreHorizontalIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

// The pager's name is the caller's (translated) `aria-label`.
function Pagination({
  className,
  ...props
}: React.ComponentProps<'nav'> & { 'aria-label': string }) {
  return (
    <nav
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button asChild variant={isActive ? 'outline' : 'ghost'} size={size} className={cn(className)}>
      <a
        aria-current={isActive ? 'page' : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      >
        {children}
      </a>
    </Button>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center text-ink-600 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
    </span>
  );
}

export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink };
