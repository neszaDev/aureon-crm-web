'use client';

import { ErrorState } from '@/components/ErrorState';
import { PublicFrame } from '@/components/PublicFrame';

// The public pages' error: the wordmark over the canvas, and the error's card on it.
export default function ErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <PublicFrame>
      <ErrorState retry={props.retry} />
    </PublicFrame>
  );
}
