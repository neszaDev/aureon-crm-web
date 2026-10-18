import { InboxIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

/**
 * What a list shows without rows: `none`, nothing recorded yet (with the create action when
 * the caller may create); `archived`, an empty archive (with a link back to the active records;
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
  const linkClass = 'font-medium text-seal-ink';
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
    <div className="flex flex-col items-start gap-3 border-t border-rule px-4 py-8 sm:px-5">
      <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className="max-w-[65ch] text-muted-foreground">{text}</p>
      </div>
      {action}
    </div>
  );
};
