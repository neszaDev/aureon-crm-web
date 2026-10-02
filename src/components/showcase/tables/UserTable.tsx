'use client';

import type { User } from '@/components/showcase/users/data';
import { useUserColumns, userRowClassName } from '@/components/showcase/users/useUserColumns';
import { DataTable } from './DataTable';

/**
 * The Vue `Table.vue` wrapper: the users with name, registered, role and status, paginated
 * (10 rows when small, 5 otherwise), in the requested table style.
 * @param props Component props.
 * @param props.users Rows, already in display order.
 * @param props.caption Accessible name of the table.
 * @param props.striped Shade every other row.
 * @param props.hover Highlight the row under the pointer.
 * @param props.bordered Rule every cell.
 * @param props.small Condensed rows.
 * @param props.fixed Equal-width columns.
 * @param props.dark Print the table on a folder-green field.
 * @returns The table.
 */
export const UserTable = (props: {
  users: User[];
  caption: string;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  small?: boolean;
  fixed?: boolean;
  dark?: boolean;
}) => {
  const columns = useUserColumns();

  return (
    <DataTable
      data={props.users}
      columns={columns}
      getRowId={(user) => String(user.id)}
      caption={props.caption}
      striped={props.striped}
      hover={props.hover ?? false}
      bordered={props.bordered}
      small={props.small}
      fixed={props.fixed}
      dark={props.dark}
      itemsPerPage={props.small ? 10 : 5}
      rowClassName={userRowClassName}
      pagination
    />
  );
};
