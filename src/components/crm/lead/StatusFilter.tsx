'use client';

import { CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOptimistic, useTransition } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';
import { LEAD_STATUSES } from '@/validations/crm/LeadValidation';

/**
 * The lead list's status filter: one toggle per status, any number of them on (`status`
 * repeated in the URL; none on lists every status). Choosing keeps the other params and goes back
 * to the first page. A status that is on carries a tick besides its fill.
 * @param props Component props.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The labelled group.
 */
export const StatusFilter = (props: { path: string; query: ListQuery }) => {
  const t = useTranslations('LeadsPage');
  const tStatus = useTranslations('LeadStatus');
  const router = useRouter();
  const [, startTransition] = useTransition();
  // What was chosen, until the new list lands: a second toggle in the meantime adds to it.
  const [selected, setSelected] = useOptimistic([props.query.params.status ?? []].flat());

  return (
    <div className="flex flex-col gap-2">
      <span
        aria-hidden="true"
        className="text-[0.8125rem] leading-snug font-medium text-muted-foreground"
      >
        {t('status_label')}
      </span>
      <ToggleGroup
        type="multiple"
        variant="outline"
        aria-label={t('status_label')}
        value={selected}
        className="flex-wrap"
        onValueChange={(next) => {
          startTransition(() => {
            setSelected(next);
            router.push(listHref(props.path, props.query, { status: next }), { scroll: false });
          });
        }}
      >
        {LEAD_STATUSES.map((status) => (
          <ToggleGroupItem key={status} value={status} className="h-10 px-3">
            {selected.includes(status) && <CheckIcon aria-hidden="true" />}
            {tStatus(`status_${status}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
