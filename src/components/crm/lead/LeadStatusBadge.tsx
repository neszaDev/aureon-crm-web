import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { components } from '@/libs/api/schema';

// The status ink of each status: text only, never a fill, and the word always comes with it.
const INKS = {
  NEW: 'text-info',
  CONTACTED: 'text-warning',
  QUALIFIED: 'text-success',
  UNQUALIFIED: 'text-muted-foreground',
  CONVERTED: 'text-success',
};

/**
 * A lead's status as an outlined badge in its status ink, in sentence case.
 * @param props Component props.
 * @param props.status The lead's status.
 * @returns The badge.
 */
export const LeadStatusBadge = (props: {
  status: components['schemas']['LeadResponse']['status'];
}) => {
  const t = useTranslations('LeadStatus');

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium tracking-normal normal-case', INKS[props.status])}
    >
      {t(`status_${props.status}`)}
    </Badge>
  );
};
