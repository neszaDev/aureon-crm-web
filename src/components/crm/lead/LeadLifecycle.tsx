import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import type { components } from '@/libs/api/schema';
import { LEAD_STATUS_TONES } from '@/libs/crm/StatusColors';

type Status = components['schemas']['LeadResponse']['status'];

const STEPS: Status[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'];

/**
 * A lead's lifecycle as its whole track, as a deal's stages are drawn: New, Contacted, Qualified,
 * Converted, one segment each with its name under it, filled up to the current one in the colour
 * of the lead's status (the current name in its ink). An unqualified lead closes the track with
 * Unqualified in place of Converted, and its reason under it; what came before is unknown (a
 * lead's history records no moves), so those segments stay empty. Each segment says its state to
 * assistive technology.
 * @param props Component props.
 * @param props.status The lead's status.
 * @param props.reason Why it is unqualified.
 * @returns The track.
 */
export const LeadLifecycle = (props: { status: Status; reason?: string }) => {
  const t = useTranslations('LeadLifecycle');
  const tStatus = useTranslations('LeadStatus');
  const unqualified = props.status === 'UNQUALIFIED';
  const steps = unqualified ? [...STEPS.slice(0, -1), props.status] : STEPS;
  const current = steps.indexOf(props.status);

  return (
    <div data-tone={LEAD_STATUS_TONES[props.status]} className="flex flex-col gap-2">
      <ol aria-label={t('label')} className="flex gap-1">
        {steps.map((step, index) => {
          let state: 'reached' | 'current' | 'unknown' | 'blank' = 'blank';
          if (props.status === 'CONVERTED' || (!unqualified && index < current)) {
            state = 'reached';
          } else if (index === current) {
            state = 'current';
          } else if (unqualified) {
            // Its history before is unknown: only the closing segment is marked.
            state = 'unknown';
          }
          const name = tStatus(`status_${step}`);
          const filled = state === 'reached' || state === 'current';

          return (
            <li key={step} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                aria-hidden="true"
                className={cn('block h-1.5 rounded-full', filled ? 'bg-(--tone)' : 'bg-rule')}
              />
              <span
                aria-hidden="true"
                title={name}
                className={cn(
                  'truncate text-[0.75rem] font-medium',
                  state === 'current' && 'font-semibold text-(--tone-ink)',
                  !filled && 'text-muted-foreground',
                )}
              >
                {name}
              </span>
              <span className="sr-only">{t(`state_${state}`, { name })}</span>
            </li>
          );
        })}
      </ol>
      {unqualified && props.reason && (
        <p className="max-w-[65ch] text-[0.8125rem] break-words">
          <span className="font-medium text-muted-foreground">{t('reason_label')}</span>{' '}
          <span className="whitespace-pre-line">{props.reason}</span>
        </p>
      )}
    </div>
  );
};
