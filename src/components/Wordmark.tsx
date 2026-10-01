import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Mark } from '@/components/report/Mark';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

/**
 * The product name with its tick, linking home.
 * @param props Component props.
 * @param props.tone `folder` on the green fields, `paper` on the card stock.
 * @param props.href Where the wordmark links (home by default).
 * @param props.className Extra classes.
 * @returns The wordmark link.
 */
export const Wordmark = (props: {
  tone?: 'folder' | 'paper';
  href?: string;
  className?: string;
}) => {
  const t = useTranslations('Brand');
  const onFolder = props.tone === 'folder';

  return (
    <Link
      href={props.href ?? '/'}
      aria-label={t('home_label')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm text-lg font-extrabold tracking-[-0.03em] no-underline',
        onFolder ? 'text-folder-ink focus-visible:outline-folder-ink' : 'text-ink-950',
        props.className,
      )}
    >
      <Mark
        status="PASSED"
        className={cn('size-6 -translate-y-px', onFolder ? 'text-folder-ink-soft' : 'text-pass')}
      />
      {AppConfig.name}
    </Link>
  );
};
