import { LogOutIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { signOut } from '@/actions/AuthActions';
import { Button } from '@/components/ui/button';

export const SignOutButton = (props: { className?: string }) => {
  const t = useTranslations('DashboardLayout');

  return (
    <form action={signOut}>
      <Button type="submit" variant="inverse-ghost" size="sm" className={props.className}>
        <LogOutIcon data-icon="inline-start" />
        {t('sign_out')}
      </Button>
    </form>
  );
};
