import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

/**
 * Switches a list between its active records and its archived ones (`archived=true`: only
 * those), as two links, the current one marked.
 * @param props Component props.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The switch.
 */
export const ArchivedToggle = (props: { path: string; query: ListQuery }) => {
  const t = useTranslations('RecordList');
  const views = [
    { key: 'active', current: !props.query.archived, archived: undefined },
    { key: 'archived', current: Boolean(props.query.archived), archived: 'true' },
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      <span
        aria-hidden="true"
        className="text-[0.8125rem] leading-snug font-medium text-muted-foreground"
      >
        {t('view_label')}
      </span>
      <nav
        aria-label={t('view_label')}
        className="flex h-9 items-stretch gap-0.5 rounded-md border border-input bg-field p-0.5 sm:h-8"
      >
        {views.map((view) => (
          <Link
            key={view.key}
            href={listHref(props.path, props.query, { archived: view.archived })}
            aria-current={view.current ? 'page' : undefined}
            scroll={false}
            className={cn(
              'flex items-center rounded-sm px-2.5 text-sm font-medium no-underline transition-colors duration-150',
              view.current
                ? 'bg-muted font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {t(`view_${view.key}`)}
          </Link>
        ))}
      </nav>
    </div>
  );
};
