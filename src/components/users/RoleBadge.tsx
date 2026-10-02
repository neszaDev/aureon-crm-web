import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/validations/UserValidation';

/**
 * A user's role as a printed tag; admins are inked, everyone else outlined.
 * @param props Component props.
 * @param props.role The role.
 * @returns The badge.
 */
export const RoleBadge = (props: { role?: UserRole }) => {
  const t = useTranslations('AccountPage');
  const role = props.role ?? 'USER';

  return <Badge variant={role === 'ADMIN' ? 'default' : 'outline'}>{t(`role_${role}`)}</Badge>;
};
