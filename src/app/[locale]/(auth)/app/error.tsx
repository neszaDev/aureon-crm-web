'use client';

import { CrmErrorState } from '@/components/crm/CrmErrorState';

export default function CrmErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <CrmErrorState retry={props.retry} />
    </main>
  );
}
