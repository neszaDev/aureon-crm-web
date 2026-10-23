import { cn } from 'cn';
import { InboxIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

/**
 * What a list shows without rows, teaching what to do next: `none`, nothing recorded yet (on the
 * violet tint, with the create action when the caller may create); `archived`, an empty archive (with a link back to the active records;
 * the list's heading already says it is empty); or `filtered`, nothing matching the search and
 * filters (with a link that clears them).
 * @param props Component props.
 * @param props.variant Which of the three.
 * @param props.title `none`: what is missing, such as "No companies yet".
 * @param props.text `none` and `archived`: what to do about it, or what shows here.
 * @param props.action `none`: the create button.
 * @param props.activeHref `archived`: the list of active records.
 * @param props.clearHref `filtered`: the list without its search and filters.
 * @returns The empty state.
 */
export const ListEmpty = (
  props:
    | { variant: 'none'; title: string; text: string; action?: React.ReactNode }
    | { variant: 'archived'; text: string; activeHref: string }
    | { variant: 'filtered'; clearHref: string },
) => {
  const t = useTranslations('RecordList');
  const linkClass = 'text-sm font-medium text-violet-ink';
  let title: string | undefined;
  let text: string;
  let action: React.ReactNode;
  if (props.variant === 'none') {
    ({ title, text, action } = props);
  } else if (props.variant === 'archived') {
    ({ text } = props);
    action = (
      <Link href={props.activeHref} className={linkClass}>
        {t('view_active_link')}
      </Link>
    );
  } else {
    title = t('filtered_title');
    text = t('filtered_text');
    action = (
      <Link href={props.clearHref} className={linkClass}>
        {t('clear_filters')}
      </Link>
    );
  }
  const Icon = props.variant === 'filtered' ? SearchXIcon : InboxIcon;

  return (
    <div className="flex flex-col items-start gap-4 border-t border-rule px-4 py-10 sm:px-5">
      <span
        aria-hidden="true"
        className={cn(
          'grid size-10 place-items-center rounded-lg',
          props.variant === 'none'
            ? 'bg-violet-tint text-violet-ink'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        {title && <p className="text-[0.9375rem] font-semibold">{title}</p>}
        <p className="max-w-[65ch] text-sm text-muted-foreground">{text}</p>
      </div>
      {action}
    </div>
  );
};
