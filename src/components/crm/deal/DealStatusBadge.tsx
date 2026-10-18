import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { components } from '@/libs/api/schema';

// The ink of each status: text only, never a fill, and the word always comes with it. Lost is
// the page's ink, and no status ever takes the seal colour (a signature, not a status).
const INKS = {
  OPEN: 'text-info',
  WON: 'text-success',
  LOST: 'text-foreground',
};

/**
 * A deal's status (the kind of its stage) as an outlined badge in its ink, in sentence case.
 * @param props Component props.
 * @param props.status Open, Won or Lost.
 * @returns The badge.
 */
export const DealStatusBadge = (props: {
  status: components['schemas']['DealSummary']['status'];
}) => {
  const t = useTranslations('DealStatus');

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium tracking-normal normal-case', INKS[props.status])}
    >
      {t(`status_${props.status}`)}
    </Badge>
  );
};
