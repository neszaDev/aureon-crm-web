import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import type { TestStatus } from '@/validations/TestResultValidation';
import { Mark } from './Mark';

/**
 * A status as it appears on the card: the drawn mark plus its name.
 * @param props Component props.
 * @param props.status Test status.
 * @param props.animate Draw the mark on when it mounts.
 * @param props.delay Delay before drawing, in milliseconds.
 * @param props.className Extra classes.
 * @param props.labelClassName Classes for the status name (e.g. hide it visually on phones).
 * @returns The mark and the localized status name.
 */
export const StatusMark = (props: {
  status: TestStatus;
  animate?: boolean;
  delay?: number;
  className?: string;
  labelClassName?: string;
}) => {
  const t = useTranslations('TestResultForm');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-medium',
        props.status === 'FAILED' ? 'text-pen' : 'text-ink-700',
        props.className,
      )}
    >
      <Mark status={props.status} animate={props.animate} delay={props.delay} />
      <span className={props.labelClassName}>{t(`status_${props.status}`)}</span>
    </span>
  );
};
