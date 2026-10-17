import 'server-only';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getWorkspace } from '@/libs/api/CrmQueries';

/**
 * The metadata of a page inside a workspace: its own title, or `ForbiddenNotice`'s when the
 * notice replaces the page (a 403 for the workspace, shown by the layout, or for the page's own
 * data). A `<title>` inside the notice would come after this one, which the browser shows.
 * @param props Options.
 * @param props.locale The page's locale.
 * @param props.workspaceId The `[workspaceId]` route segment.
 * @param props.title The page's own title.
 * @param props.forbidden Whether the backend answered 403 for the page's data.
 * @returns The metadata.
 */
export const workspacePageMetadata = async (props: {
  locale: string;
  workspaceId: string;
  title: string;
  forbidden?: boolean;
}): Promise<Metadata> => {
  const { forbidden } = await getWorkspace(props.workspaceId);
  if (forbidden || props.forbidden) {
    const t = await getTranslations({ locale: props.locale, namespace: 'ForbiddenNotice' });
    return { title: t('title') };
  }

  return { title: props.title };
};
