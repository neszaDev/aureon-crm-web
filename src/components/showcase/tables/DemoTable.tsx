'use client';

import { SettingsIcon, Trash2Icon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { USERS } from '@/components/showcase/users/data';
import { useUserColumns, VUE_COLUMN_WIDTHS } from '@/components/showcase/users/useUserColumns';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';
import { DataTable } from './DataTable';

/**
 * The Vue `DemoTable`: every `CDataTable` option at once (table and column filters, rows per
 * page, sorting, pagination) with a details panel per row.
 * @returns The table.
 */
export const DemoTable = () => {
  const t = useTranslations('AdvancedTablesPage');
  const format = useFormatter();
  const [users, setUsers] = useState(USERS);
  const columns = useUserColumns({ widths: VUE_COLUMN_WIDTHS });

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(user) => String(user.id)}
      caption={t('demo_title')}
      itemsPerPage={5}
      tableFilter
      columnFilter
      itemsPerPageSelect
      sorter
      pagination
      renderDetails={(user) => (
        <div className="flex items-start gap-4 py-2">
          <Image
            src={`/assets/images/avatars/${((user.id - 1) % 8) + 1}.jpg`}
            alt=""
            width={72}
            height={72}
            className="size-18 shrink-0 rounded-sm object-cover"
          />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-ink-950">{user.username}</h3>
            <p className="text-ink-600">
              {t('user_since', {
                date: format.dateTime(new Date(`${user.registered}T00:00:00Z`), {
                  dateStyle: 'long',
                  timeZone: 'UTC',
                }),
              })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/users/${user.id}`}>
                  <SettingsIcon data-icon="inline-start" />
                  {t('user_settings')}
                </Link>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setUsers((current) => current.filter((row) => row.id !== user.id));
                }}
              >
                <Trash2Icon data-icon="inline-start" />
                {t('delete_user')}
              </Button>
            </div>
          </div>
        </div>
      )}
    />
  );
};
