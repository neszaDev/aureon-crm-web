import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

const TONES = {
  paper: { link: 'text-foreground', seal: 'text-seal-ink' },
  seal: { link: 'text-on-seal focus-visible:outline-on-seal', seal: 'text-on-seal' },
  folder: {
    link: 'text-folder-ink focus-visible:outline-folder-ink',
    seal: 'text-folder-ink-soft',
  },
};

/**
 * The brand's round seal with an "A", pressed at a slight angle like a stamp. Decorative.
 * @param props Component props.
 * @param props.className Size and colour (it draws in `currentColor`).
 * @returns The seal.
 */
const BrandSeal = (props: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={props.className}
  >
    <g transform="rotate(-8 12 12)">
      <circle cx="12" cy="12" r="10.25" strokeWidth="2" />
      <circle cx="12" cy="12" r="7.75" strokeWidth="0.75" />
      <path d="M8.9 15.6 12 7.6l3.1 8M10 12.9h4" strokeWidth="1.9" />
    </g>
  </svg>
);

/**
 * The product name with its seal, linking home.
 * @param props Component props.
 * @param props.tone `paper` on Aureon's paper and ground (default), `seal` on the vermilion seal
 *   fill, `folder` on the boilerplate demo's green fields.
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
        'inline-flex items-center gap-2 rounded-sm text-lg font-bold tracking-[-0.02em] no-underline',
        tone.link,
        props.className,
      )}
    >
      <BrandSeal className={cn('size-6 shrink-0', tone.seal)} />
      {AppConfig.name}
    </Link>
  );
};
