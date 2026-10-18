import { cn } from 'cn';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';
import { WORKSPACE_ROLES } from '@/validations/crm/MemberValidation';

const MANAGERS: readonly WorkspaceRole[] = ['OWNER', 'ADMIN', 'MANAGER'];
const ADMINS: readonly WorkspaceRole[] = ['OWNER', 'ADMIN'];

// The matrix of the backend's docs/crm/permissions.md, row for row. The backend enforces it.
const MATRIX = [
  { key: 'read', roles: WORKSPACE_ROLES },
  { key: 'create', roles: WORKSPACE_ROLES },
  { key: 'edit_any', roles: MANAGERS },
  { key: 'edit_own', roles: WORKSPACE_ROLES },
  { key: 'assign', roles: MANAGERS },
  { key: 'export', roles: MANAGERS },
  { key: 'workspace', roles: ADMINS },
  { key: 'settings', roles: ADMINS },
  { key: 'members', roles: ADMINS },
  { key: 'audit', roles: ADMINS },
] as const;

/**
 * What each workspace role may do, with the reader's own role marked: a table, and on phones
 * (where four role columns don't fit in every language) each ability with the roles that have it.
 * @param props Component props.
 * @param props.current The reader's role in this workspace.
 * @returns The table and the phone list.
 */
export const RolesMatrix = (props: { current?: WorkspaceRole }) => {
  const t = useTranslations('RolesMatrix');
  const tRole = useTranslations('Roles');

  return (
    <>
      <ul className="sm:hidden">
        {MATRIX.map((row) => (
          <li key={row.key} className="border-t border-rule px-5 py-3">
            <p>{t(`row_${row.key}`)}</p>
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
              {row.roles.map((role, index) => (
                <span key={role}>
                  {index > 0 && ' · '}
                  <span className={cn(role === props.current && 'font-semibold text-seal-ink')}>
                    {tRole(`role_${role}`)}
                  </span>
                  {row.key === 'members' && role === 'ADMIN' && ` (${t('not_owners')})`}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full text-[0.8125rem] whitespace-normal">
                {t('ability')}
              </TableHead>
              {WORKSPACE_ROLES.map((role) => (
                <TableHead
                  key={role}
                  className={cn(
                    'px-3 text-center text-[0.8125rem] whitespace-normal',
                    role === props.current && 'bg-seal-tint text-seal-ink',
                  )}
                >
                  {tRole(`role_${role}`)}
                  {role === props.current && (
                    <span className="block text-xs font-medium">{t('yours')}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MATRIX.map((row) => (
              <TableRow key={row.key} className="hover:bg-transparent">
                <th
                  scope="row"
                  className="min-w-36 px-3 py-2.5 text-left align-middle font-normal text-foreground"
                >
                  {t(`row_${row.key}`)}
                </th>
                {WORKSPACE_ROLES.map((role) => {
                  const allowed = row.roles.includes(role);

                  return (
                    <TableCell
                      key={role}
                      className={cn(
                        'px-3 text-center',
                        role === props.current && 'bg-seal-tint/50',
                      )}
                    >
                      {allowed ? (
                        <CheckIcon aria-hidden="true" className="mx-auto size-4 text-seal-ink" />
                      ) : (
                        <MinusIcon
                          aria-hidden="true"
                          className="mx-auto size-4 text-muted-foreground"
                        />
                      )}
                      <span className="sr-only">{t(allowed ? 'allowed' : 'not_allowed')}</span>
                      {allowed && row.key === 'members' && role === 'ADMIN' && (
                        <span className="mt-0.5 block text-xs whitespace-normal text-muted-foreground">
                          {t('not_owners')}
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
