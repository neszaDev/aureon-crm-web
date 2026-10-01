'use client';

import { ErrorState } from '@/components/ErrorState';

export default function ErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <ErrorState retry={props.retry} />
    </main>
  );
}
