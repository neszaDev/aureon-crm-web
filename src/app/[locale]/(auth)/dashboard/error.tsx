'use client';

import { ErrorState } from '@/components/ErrorState';

// Keeps the app shell: only the page area is replaced.
export default function DashboardErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="py-8">
      <ErrorState retry={props.retry} homeHref="/dashboard/" />
    </div>
  );
}
