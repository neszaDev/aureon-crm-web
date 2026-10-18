import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StampBox } from '@/components/crm/StampBox';
import type { components } from '@/libs/api/schema';

type Status = components['schemas']['LeadResponse']['status'];

const STEPS: Status[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'];

/**
 * A lead's lifecycle as a short stamp row: New, Contacted, Qualified, Converted, each a fixed
 * box with its name under it: the stages passed ticked, the current one outlined in ink. An
 * unqualified lead closes the row with Unqualified in place of Converted, and its reason. A
 * lead's history records no signer, so no box carries a seal. Each box says its state to
 * assistive technology.
 * @param props Component props.
 * @param props.status The lead's status.
 * @param props.reason Why it is unqualified.
 * @returns The row, with a line on how the lifecycle runs.
 */
export const LeadLifecycle = (props: { status: Status; reason?: string }) => {
  const t = useTranslations('LeadLifecycle');
  const tStatus = useTranslations('LeadStatus');
  const unqualified = props.status === 'UNQUALIFIED';
  const steps = unqualified ? [...STEPS.slice(0, -1), props.status] : STEPS;
  const current = steps.indexOf(props.status);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-rule bg-card px-5 py-4">
      <ol aria-label={t('label')} className="flex gap-1">
        {steps.map((step, index) => {
          let state: 'reached' | 'current' | 'blank' = 'blank';
          // An unqualified lead's history before it is unknown: only the closing box is marked.
          if (props.status === 'CONVERTED' || (!unqualified && index < current)) {
            state = 'reached';
          } else if (index === current) {
            state = 'current';
          }
          const name = tStatus(`status_${step}`);

          return (
            <li key={step} className="flex w-[4.75rem] flex-col items-center gap-1.5 sm:w-24">
              <StampBox open={state === 'current'}>
                {state === 'reached' && <CheckIcon aria-hidden="true" className="size-4" />}
                {state === 'current' && unqualified && (
                  <XIcon aria-hidden="true" className="size-4 text-foreground" />
                )}
                <span className="sr-only">{t(`state_${state}`, { name })}</span>
              </StampBox>
              <span
                aria-hidden="true"
                className="text-center text-[0.8125rem] leading-snug font-medium break-words"
              >
                {name}
              </span>
            </li>
          );
        })}
      </ol>
      {unqualified && props.reason && (
        <p className="max-w-[65ch] break-words">
          <span className="text-[0.8125rem] font-medium text-muted-foreground">
            {t('reason_label')}
          </span>{' '}
          <span className="whitespace-pre-line">{props.reason}</span>
        </p>
      )}
      {props.status !== 'CONVERTED' && (
        <p className="max-w-[65ch] text-sm text-muted-foreground">{t('hint')}</p>
      )}
    </section>
  );
};
