import { InboxIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

/**
 * What a list shows without rows: `none`, nothing recorded yet (with the create action when
 * the caller may create), or `filtered`, nothing matching the search and filters (with a link
 * that clears them).
 * @param props Component props.
 * @param props.variant Which of the two.
 * @param props.title `none`: what is missing, such as "No companies yet".
 * @param props.text `none`: what to do about it.
 * @param props.action `none`: the create button.
 * @param props.clearHref `filtered`: the list without its search and filters.
 * @returns The empty state.
 */
export const ListEmpty = (
  props:
    | { variant: 'none'; title: string; text: string; action?: React.ReactNode }
    | { variant: 'filtered'; clearHref: string },
) => {
  const t = useTranslations('RecordList');
  const Icon = props.variant === 'none' ? InboxIcon : SearchXIcon;

  return (
    <div className="flex flex-col items-start gap-3 border-t border-rule px-4 py-8 sm:px-5">
      <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {props.variant === 'none' ? props.title : t('filtered_title')}
        </p>
        <p className="max-w-[65ch] text-muted-foreground">
          {props.variant === 'none' ? props.text : t('filtered_text')}
        </p>
      </div>
      {props.variant === 'none' ? (
        props.action
      ) : (
        <Link href={props.clearHref} className="font-medium text-seal-ink">
          {t('clear_filters')}
        </Link>
      )}
    </div>
  );
};
