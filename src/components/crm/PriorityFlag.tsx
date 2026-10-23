import { cn } from 'cn';
import { FlagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PRIORITY_TONES } from '@/libs/crm/StatusColors';

/**
 * A lead's or task's priority as a flag in its colour, high filled; its word is read out and
 * shown as its tooltip.
 * @param props Component props.
 * @param props.priority The priority.
 * @returns The flag.
 */
export const PriorityFlag = (props: { priority: keyof typeof PRIORITY_TONES }) => {
  const t = useTranslations('PriorityFlag');
  const label = t(`level_${props.priority}`);

  return (
    <span
      data-tone={PRIORITY_TONES[props.priority]}
      title={label}
      className="inline-flex items-center text-(--tone-ink)"
    >
      <FlagIcon
        aria-hidden="true"
        className={cn('size-3.5', props.priority === 'HIGH' && 'fill-current')}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};
