import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { AureonMark } from '@/components/brand/AureonMark';
import { Link } from '@/libs/I18nNavigation';

const TONES = {
  paper: { link: 'text-foreground', mark: 'text-violet-ink' },
  seal: { link: 'text-on-seal focus-visible:outline-on-seal', mark: 'text-on-seal' },
  folder: {
    link: 'text-folder-ink focus-visible:outline-folder-ink',
    mark: 'text-folder-ink-soft',
  },
};

/**
 * The brand: the orbit mark and "Aureon", linking home.
 * @param props Component props.
 * @param props.tone `paper` on the canvas and panels (default), `seal` on the ink-violet rail,
 *   `folder` on the boilerplate demo's green fields.
 * @param props.href Where the wordmark links (home by default).
 * @param props.className Extra classes.
 * @returns The wordmark link.
 */
export const Wordmark = (props: {
  tone?: keyof typeof TONES;
  href?: string;
  className?: string;
}) => {
  const t = useTranslations('Brand');
  const tone = TONES[props.tone ?? 'paper'];

  return (
    <Link
      href={props.href ?? '/'}
      aria-label={t('home_label')}
      className={cn(
        'inline-flex items-center gap-2 rounded-sm text-xl font-semibold tracking-[-0.02em] no-underline',
        tone.link,
        props.className,
      )}
    >
      <AureonMark className={cn('size-6 shrink-0', tone.mark)} />
      {t('wordmark')}
    </Link>
  );
};
