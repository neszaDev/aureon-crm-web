import { useTranslations } from 'next-intl';
import { signOut } from '@/actions/AuthActions';

export const SignOutButton = () => {
  const t = useTranslations('DashboardLayout');

  return (
    <form action={signOut}>
      <button className="border-none text-gray-700 hover:text-gray-900" type="submit">
        {t('sign_out')}
      </button>
    </form>
  );
};
