import { cn } from 'cn';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { BrandIcon } from '@/components/showcase/widgets/BrandIcon';
import { ToneProgress } from '@/components/showcase/widgets/ToneProgress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Presence } from './data';
import { ACTIVITY_NOW, USERS, usageTone } from './data';

const PRESENCE_DOT: Record<Presence, string> = {
  online: 'bg-pass',
  busy: 'bg-pencil',
  away: 'bg-ink-400',
  offline: 'bg-ink-200',
};

/**
 * The dashboard's users table: avatar with presence, name and registration, country, usage
 * bar for the period, payment method and last login.
 * @returns The table.
 */
export const UsersTable = () => {
  const t = useTranslations('AnalyticsUsers');
  const format = useFormatter();
  const regions = new Intl.DisplayNames([useLocale()], { type: 'region' });
  const presence: Record<Presence, string> = {
    online: t('presence_online'),
    busy: t('presence_busy'),
    away: t('presence_away'),
    offline: t('presence_offline'),
  };

  return (
    <div className="overflow-hidden rounded-sm border border-ink-200 bg-ply">
      <Table>
        <TableHeader className="bg-paper">
          <TableRow>
            <TableHead className="w-14">
              <span className="sr-only">{t('column_avatar')}</span>
            </TableHead>
            <TableHead>{t('column_user')}</TableHead>
            <TableHead>{t('column_country')}</TableHead>
            <TableHead className="min-w-44">{t('column_usage')}</TableHead>
            <TableHead className="text-center">{t('column_payment')}</TableHead>
            <TableHead>{t('column_activity')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {USERS.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <span className="relative inline-flex">
                  <Image
                    src={user.avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                  />
                  <span
                    className={cn(
                      'absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-ply',
                      PRESENCE_DOT[user.presence],
                    )}
                  />
                  <span className="sr-only">{presence[user.presence]}</span>
                </span>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-ink-950">{user.name}</div>
                <div className="text-[0.8125rem] text-ink-600">
                  {t('registered', {
                    kind: user.isNew ? 'new' : 'recurring',
                    date: format.dateTime(new Date(user.registered), {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    }),
                  })}
                </div>
              </TableCell>
              <TableCell>{regions.of(user.country)}</TableCell>
              <TableCell>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <strong className="text-ink-950 tabular-nums">
                    {format.number(user.usage / 100, { style: 'percent' })}
                  </strong>
                  <small className="text-xs text-ink-600">
                    {t('date_range', {
                      start: format.dateTime(new Date(user.usageFrom), {
                        dateStyle: 'medium',
                        timeZone: 'UTC',
                      }),
                      end: format.dateTime(new Date(user.usageTo), {
                        dateStyle: 'medium',
                        timeZone: 'UTC',
                      }),
                    })}
                  </small>
                </div>
                <ToneProgress
                  value={user.usage}
                  tone={usageTone(user.usage)}
                  label={t('usage_label', { name: user.name })}
                />
              </TableCell>
              <TableCell className="text-center">
                <BrandIcon
                  brand={user.payment.brand}
                  label={user.payment.name}
                  className="mx-auto size-6 text-ink-700"
                />
              </TableCell>
              <TableCell>
                <div className="text-xs text-ink-600">{t('last_login')}</div>
                <strong className="font-semibold text-ink-950">
                  {format.relativeTime(
                    new Date(ACTIVITY_NOW.getTime() - user.lastSeenSecondsAgo * 1000),
                    ACTIVITY_NOW,
                  )}
                </strong>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
