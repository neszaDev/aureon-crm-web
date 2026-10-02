import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';

/**
 * The full-screen loading overlay (Vue `CenterLoading`): a dimmed page with a centred spinner
 * while a request runs. It blocks clicks on the page underneath.
 * @param props Component props.
 * @param props.open Whether the overlay is shown.
 * @returns The overlay, or nothing when closed.
 */
export const LoadingOverlay = (props: { open: boolean }) => {
  const t = useTranslations('CampusLoading');

  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/30 backdrop-blur-xs">
      <Spinner label={t('label')} className="size-16 text-folder" />
    </div>
  );
};
