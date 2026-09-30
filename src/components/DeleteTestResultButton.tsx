import { useTranslations } from 'next-intl';
import { deleteTestResult } from '@/actions/TestResultActions';

export const DeleteTestResultButton = (props: { id: number; name: string }) => {
  const t = useTranslations('TestResultsPage');

  return (
    <form action={deleteTestResult.bind(null, props.id)}>
      <button
        className="text-sm text-red-700 hover:underline"
        type="submit"
        aria-label={t('delete_label', { name: props.name })}
      >
        {t('delete_button')}
      </button>
    </form>
  );
};
