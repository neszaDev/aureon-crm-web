import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Mark } from '@/components/report/Mark';
import type { UserStatus } from './data';

// Status is a drawn mark, never a pill: the Vue badges map onto the report-card marks.
const MARKS = {
  active: 'PASSED',
  banned: 'FAILED',
  pending: 'PENDING',
} as const;

/**
 * A user's account status as a drawn mark plus its name (the Vue status badge).
 * Inactive accounts get a plain pencil dash.
 * @param props Component props.
 * @param props.status Account status.
 * @param props.className Extra classes.
 * @returns The mark and the localized status name.
 */
export const UserStatusMark = (props: { status: UserStatus; className?: string }) => {
  const t = useTranslations('UsersTable');

  return (
    <span
      data-slot="user-status"
      className={cn(
        'inline-flex items-center gap-2 font-medium',
        props.status === 'banned' ? 'text-pen' : 'text-ink-700',
        props.className,
      )}
    >
      {props.status === 'inactive' ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="size-5 shrink-0 text-ink-400"
        >
          <path
            d="M5 12.4c4.6-.5 9.3-.6 14 .1"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <Mark status={MARKS[props.status]} />
      )}
      <span>{t(`status_${props.status}`)}</span>
    </span>
  );
};
