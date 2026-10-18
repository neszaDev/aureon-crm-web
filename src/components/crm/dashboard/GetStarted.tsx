import { useTranslations } from 'next-intl';
import { QuickActions } from '@/components/crm/dashboard/QuickActions';
import type { components } from '@/libs/api/schema';
import { can } from '@/libs/crm/Permissions';
import { Link } from '@/libs/I18nNavigation';

/**
 * What an empty workspace shows in place of the dashboard: the five create actions and a link to
 * Settings → Members (to invite for whoever may, else to see the team). No seals: nothing has
 * been signed yet.
 * @param props Component props.
 * @param props.workspace The workspace: its id, time zone and the caller's permissions.
 * @param props.members The workspace's members, for the task's assignee.
 * @param props.me The caller's user id.
 * @returns The panel.
 */
export const GetStarted = (props: {
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone' | 'permissions'>;
  members: components['schemas']['MemberRef'][];
  me: number;
}) => {
  const t = useTranslations('GetStarted');

  return (
    <section
      aria-labelledby="get-started-heading"
      className="flex flex-col items-start gap-5 rounded-lg border border-rule bg-card p-5 sm:p-6"
    >
      <div className="flex max-w-[65ch] flex-col gap-1">
        <h2 id="get-started-heading" className="text-lg font-semibold">
          {t('title')}
        </h2>
        <p className="text-muted-foreground">{t('text')}</p>
      </div>
      <QuickActions workspace={props.workspace} members={props.members} me={props.me} />
      <Link
        href={`/app/${props.workspace.id}/settings/members`}
        className="font-medium text-seal-ink"
      >
        {can(props.workspace, 'MEMBERS_MANAGE') ? t('members_manage') : t('members_view')}
      </Link>
    </section>
  );
};
