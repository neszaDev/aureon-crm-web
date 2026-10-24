'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { TOOL_PART, toolClass } from '@/components/crm/list/FilterChip';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * "Me": a toggle of the owner filter between the caller and anyone (`ownerId`; tasks: the
 * assignee, `assigneeId`). Pressed while the list shows only the caller's records. Keeps the
 * other params, back to the first page.
 * @param props Component props.
 * @param props.me The caller.
 * @param props.param The URL param it sets: `ownerId` (default) or `assigneeId`.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The toggle.
 */
export const MeToggle = (props: {
  me: components['schemas']['UserResponse'];
  param?: 'ownerId' | 'assigneeId';
  path: string;
  query: ListQuery;
}) => {
  const t = useTranslations('ListToolbar');
  const router = useRouter();
  const param = props.param ?? 'ownerId';
  const mine = props.query.params[param] === String(props.me.id);

  return (
    <button
      type="button"
      aria-pressed={mine}
      className={cn(toolClass(mine), TOOL_PART)}
      onClick={() => {
        router.push(
          listHref(props.path, props.query, { [param]: mine ? undefined : String(props.me.id) }),
          { scroll: false },
        );
      }}
    >
      <PersonAvatar person={{ ...props.me, userId: props.me.id }} size="xs" />
      {t('me')}
    </button>
  );
};
