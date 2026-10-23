import { useTranslations } from 'next-intl';
import type { FilterOption } from '@/components/crm/list/FilterSelect';
import { FilterSelect } from '@/components/crm/list/FilterSelect';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';

/**
 * A list's owner filter (`ownerId`; tasks: the assignee, `assigneeId`): Anyone, Me, Unassigned,
 * then every other member, by seal and name. An owner who left the workspace, or an id typed in
 * the URL, reads "Former member".
 * @param props Component props.
 * @param props.id The select's id.
 * @param props.param The URL param it sets: `ownerId` (default) or `assigneeId`.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The filter.
 */
export const OwnerFilter = (props: {
  id: string;
  param?: 'ownerId' | 'assigneeId';
  me: components['schemas']['UserResponse'];
  members: components['schemas']['MemberResponse'][];
  path: string;
  query: ListQuery;
}) => {
  const t = useTranslations('OwnerFilter');
  const options: FilterOption[] = [
    { value: String(props.me.id), label: t('me'), person: { ...props.me, userId: props.me.id } },
    { value: 'unassigned', label: t('unassigned') },
    ...props.members
      .filter((member) => member.userId !== props.me.id)
      .map((member) => ({
        value: String(member.userId),
        label: member.displayName ?? member.email,
        person: member,
      })),
  ];

  return (
    <FilterSelect
      id={props.id}
      label={props.param === 'assigneeId' ? t('label_assignee') : t('label')}
      anyLabel={t('any')}
      missingLabel={t('former')}
      param={props.param ?? 'ownerId'}
      options={options}
      path={props.path}
      query={props.query}
    />
  );
};
