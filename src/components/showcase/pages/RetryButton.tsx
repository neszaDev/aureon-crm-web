'use client';

import { RotateCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * "Try again" for the server error preview: re-renders the page from the server.
 * @param props Component props.
 * @param props.children The button's label.
 * @returns The button.
 */
export const RetryButton = (props: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        router.refresh();
      }}
    >
      <RotateCcwIcon data-icon="inline-start" />
      {props.children}
    </Button>
  );
};
