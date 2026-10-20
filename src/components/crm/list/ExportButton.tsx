'use client';

import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';
import { can } from '@/libs/crm/Permissions';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * Hands a file to the browser's downloads under a name.
 * @param file The file.
 * @param name Its name.
 */
const save = (file: Blob, name: string) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // The download has its own reference by then; this only frees the file's memory.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * "Export CSV" on a list: downloads the records of the list's current search and filters. It asks
 * our own route (`/api/crm/{workspace}/export/{list}`), never the backend, and saves the file
 * only once all of it has arrived, so a failure half way leaves no broken file. The file's name is
 * the server's (`Content-Disposition`). A refusal (a file over the cap, a role without the
 * permission) shows in a toast with the route's translated message, and an ended session goes to
 * sign in. Only a role with `EXPORT` sees it (the backend still checks).
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.permissions The caller's permissions in it.
 * @param props.list Which list.
 * @param props.query The list's current query: its params are what the export is filtered by (the
 *   route drops the paging and the sort).
 * @returns The button.
 */
export const ExportButton = (props: {
  workspaceId: number;
  permissions: Permission[];
  list: 'companies' | 'contacts' | 'leads' | 'deals';
  query: Pick<ListQuery, 'params'>;
}) => {
  const t = useTranslations('ExportButton');
  const tError = useTranslations('ApiError');
  const tAction = useTranslations('ActionError');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const download = async () => {
    try {
      const response = await fetch(
        `/api/crm/${props.workspaceId}/export/${props.list}${listHref('', props.query, { locale })}`,
      );
      if (response.status === 401) {
        router.push('/sign-in?expired=1');
        return;
      }
      if (!response.ok) {
        // The route's own JSON; anything else (a gateway's page) is a plain refusal.
        const body: unknown = await response.json().catch(() => null);
        const message =
          typeof body === 'object' && body !== null ? Reflect.get(body, 'message') : undefined;
        toast.error(typeof message === 'string' ? message : tError('generic'));
        return;
      }
      // All of it first: a file that breaks off half way throws here, and nothing is saved.
      const file = await response.blob();
      const name =
        /filename="?([^";]+)"?/iu.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ??
        `${props.list}.csv`;
      save(file, name);
      toast.success(t('saved', { name }));
    } catch {
      toast.error(tAction('network'));
    }
  };

  if (!can({ permissions: props.permissions }, 'EXPORT')) {
    return null;
  }

  return (
    <Button
      variant="outline"
      // aria-disabled, not disabled: a disabled button drops the focus to the page.
      aria-disabled={isPending || undefined}
      onClick={() => {
        if (isPending) {
          return;
        }
        startTransition(download);
      }}
    >
      {isPending ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : (
        <DownloadIcon data-icon="inline-start" />
      )}
      {t('label')}
    </Button>
  );
};
