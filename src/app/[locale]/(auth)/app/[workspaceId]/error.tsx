'use client';

import { CrmErrorState } from '@/components/crm/CrmErrorState';

// Keeps the shell: only the page area is replaced.
export default function WorkspaceErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="py-8">
      <CrmErrorState retry={props.retry} />
    </div>
  );
}
