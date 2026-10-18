import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TaskDialog } from '@/components/crm/task/TaskDialog';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { canAssign } from '@/libs/crm/RecordAccess';
import { Link } from '@/libs/I18nNavigation';

const RECORDS = ['company', 'contact', 'lead', 'deal'] as const;
const PATHS = { company: 'companies', contact: 'contacts', lead: 'leads', deal: 'deals' } as const;

/**
 * The five "New ..." actions: a link to each record's form, and the task dialog. Every role may
 * create all five (permissions.md: the matrix has no create permission, only editing, assigning
 * and the settings), so none is hidden; what a role may not do the form handles (the owner field
 * is read-only without `RECORDS_ASSIGN`).
 * @param props Component props.
 * @param props.workspace The workspace: its id, time zone and the caller's permissions.
 * @param props.members The workspace's members, for the task's assignee.
 * @param props.me The caller's user id.
 * @returns The group of buttons.
 */
export const QuickActions = (props: {
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone' | 'permissions'>;
  members: components['schemas']['MemberRef'][];
  me: number;
}) => {
  const t = useTranslations('QuickActions');

  return (
    <fieldset className="flex min-w-0 flex-wrap gap-2">
      <legend className="sr-only">{t('label')}</legend>
      {RECORDS.map((record) => (
        <Button key={record} asChild variant="outline">
          <Link href={`/app/${props.workspace.id}/${PATHS[record]}/new`}>
            <PlusIcon data-icon="inline-start" />
            {t(record)}
          </Link>
        </Button>
      ))}
      <TaskDialog
        trigger={
          <Button variant="outline">
            <PlusIcon data-icon="inline-start" />
            {t('task')}
          </Button>
        }
        workspaceId={props.workspace.id}
        members={props.members}
        me={props.me}
        canAssign={canAssign(props.workspace)}
        timeZone={props.workspace.timezone}
      />
    </fieldset>
  );
};
