import { DownloadIcon } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fileSizeUnit } from '@/utils/FileSize';
import { getI18nPath } from '@/utils/Helpers';
import { DeleteFileButton } from './DeleteFileButton';

export type FileRow = {
  id?: number;
  name?: string;
  contentType?: string;
  size?: number;
  createdAt?: string;
};

/**
 * The signed-in user's files: name (downloads it), size, when it was uploaded, delete.
 * @param props Component props.
 * @param props.rows The files on this page.
 * @returns The table, or a ruled empty row.
 */
export const FilesTable = (props: { rows: FileRow[] }) => {
  const t = useTranslations('FilesPage');
  const format = useFormatter();
  const locale = useLocale();

  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="sm:w-1/2">{t('column_name')}</TableHead>
          <TableHead className="text-right">{t('column_size')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('column_uploaded')}</TableHead>
          <TableHead>
            <span className="sr-only">{t('column_actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="py-8 text-center whitespace-normal text-ink-600">
              {t('empty')}
            </TableCell>
          </TableRow>
        ) : (
          props.rows.map((file) => {
            const size = fileSizeUnit(file.size ?? 0);

            return (
              <TableRow key={file.id}>
                <TableCell className="whitespace-normal">
                  {/* A plain link: the route handler answers with a download, not a page. */}
                  <a
                    href={getI18nPath(`/dashboard/files/${file.id}/content`, locale)}
                    download={file.name}
                    className="inline-flex items-center gap-2 font-semibold break-all text-ink-950 underline-offset-4 hover:underline"
                  >
                    <DownloadIcon aria-hidden="true" className="size-4 shrink-0 text-ink-600" />
                    {file.name}
                  </a>
                  <span className="mt-0.5 block text-xs text-ink-600">{file.contentType}</span>
                </TableCell>
                <TableCell className="text-right text-ink-950 tabular-nums">
                  {format.number(size.value, {
                    style: 'unit',
                    unit: size.unit,
                    maximumFractionDigits: 1,
                  })}
                </TableCell>
                <TableCell className="hidden text-ink-600 sm:table-cell">
                  {file.createdAt && (
                    <time dateTime={file.createdAt}>
                      {format.dateTime(new Date(file.createdAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {file.id !== undefined && (
                    <DeleteFileButton id={file.id} name={file.name ?? ''} />
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
