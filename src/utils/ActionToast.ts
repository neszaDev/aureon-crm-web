import { toast } from 'sonner';
import type { ActionResult } from '@/libs/api/ApiError';

/**
 * Shows a refused action in a toast, with a reload when someone changed the record first.
 * @param result The refusal.
 * @param fallback The message without one from the backend.
 * @param reload The reload button's label.
 */
export const toastActionFailure = (result: ActionResult, fallback: string, reload: string) => {
  toast.error(result.message ?? fallback, {
    action: result.conflict
      ? {
          label: reload,
          onClick: () => {
            window.location.reload();
          },
        }
      : undefined,
  });
};
