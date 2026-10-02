import { cn } from 'cn';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { DISPLAY_STYLES, HEADING_STYLES, TEXT_STYLES } from '@/components/showcase/theme/typeScale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CODE = 'rounded-sm bg-ink-100 px-1 py-0.5 font-mono text-[0.8125rem] text-ink-950';

const code = (chunks: React.ReactNode) => <code className={CODE}>{chunks}</code>;

const INLINE_TAGS = ['del', 's', 'ins', 'u', 'small', 'strong', 'em'] as const;

const INLINE_ROW = 'flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4';

/** How each inline element renders a line of text (`mark` wraps one word, so it is rich text). */
const INLINE: Record<(typeof INLINE_TAGS)[number], (text: string) => React.ReactNode> = {
  del: (text: string) => <del>{text}</del>,
  s: (text: string) => <s>{text}</s>,
  ins: (text: string) => <ins className="decoration-folder">{text}</ins>,
  u: (text: string) => <u>{text}</u>,
  small: (text: string) => <small className="text-[0.8125rem]">{text}</small>,
  strong: (text: string) => <strong>{text}</strong>,
  em: (text: string) => <em>{text}</em>,
};

export default async function TypographyPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TypographyPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('headings_title')} description={t('headings_description')}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('column_element')}</TableHead>
              <TableHead>{t('column_example')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {HEADING_STYLES.map((style) => (
              <TableRow key={style.key}>
                <TableCell className="w-24 align-top whitespace-normal sm:w-40">
                  <code className={CODE}>{`<${style.tag}>`}</code>
                  <p className="mt-2 text-[0.8125rem] text-ink-600">{t(`role_${style.key}`)}</p>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <span className={cn('block text-ink-950', style.className)}>
                    {t(`sample_${style.key}`)}
                  </span>
                  <span className="mt-1 block text-xs text-ink-600 tabular-nums">{style.spec}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DemoCard>

      <DemoCard
        title={t('classes_title')}
        description={t.rich('classes_description', { code })}
        contentClassName="flex flex-col gap-5"
      >
        {HEADING_STYLES.map((style) => (
          <div key={style.key} className="flex flex-col gap-1.5">
            <p className={cn('text-ink-950', style.className)}>{t(`sample_${style.key}`)}</p>
            <code className={cn(CODE, 'w-fit break-all')}>{style.className}</code>
          </div>
        ))}
      </DemoCard>

      <DemoCard title={t('display_title')} description={t('display_description')}>
        <Table>
          <TableBody>
            {DISPLAY_STYLES.map((style) => (
              <TableRow key={style.key}>
                <TableCell className="py-5 whitespace-normal">
                  <span className={cn('block text-ink-950', style.className)}>
                    {t(`sample_${style.key}`)}
                  </span>
                  <span className="mt-2 block text-xs text-ink-600 tabular-nums">
                    {t(`role_${style.key}`)} · {style.spec}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DemoCard>

      <DemoCard title={t('text_title')} description={t('text_description')}>
        <dl className="flex flex-col">
          {TEXT_STYLES.map((style) => (
            <div
              key={style.key}
              className="grid gap-2 border-b border-ink-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <dt className="flex flex-col gap-1">
                <span className="form-label">{t(`text_${style.key}`)}</span>
                <span className="text-xs text-ink-600 tabular-nums">{style.spec}</span>
              </dt>
              <dd className={cn('max-w-[62ch] text-ink-900', style.className)}>
                {t(`text_sample_${style.key}`)}
              </dd>
            </div>
          ))}
        </dl>
      </DemoCard>

      <DemoCard title={t('inline_title')} description={t('inline_description')}>
        <ul className="flex flex-col gap-3 text-[0.9375rem] text-ink-900">
          <li className={INLINE_ROW}>
            <code className={cn(CODE, 'w-fit shrink-0 sm:w-20')}>{'<mark>'}</code>
            <p>
              {t.rich('inline_mark', {
                mark: (chunks) => (
                  <mark className="rounded-xs bg-folder/15 px-0.5 text-ink-950">{chunks}</mark>
                ),
              })}
            </p>
          </li>
          {INLINE_TAGS.map((tag) => (
            <li key={tag} className={INLINE_ROW}>
              <code className={cn(CODE, 'w-fit shrink-0 sm:w-20')}>{`<${tag}>`}</code>
              <p>{INLINE[tag](t(`inline_${tag}`))}</p>
            </li>
          ))}
        </ul>
      </DemoCard>

      <DemoCard title={t('dl_title')} description={t.rich('dl_description', { code })}>
        <dl className="grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[minmax(0,1fr)_3fr]">
          <dt className="form-label pt-1">{t('dl_term_lists')}</dt>
          <dd>{t('dl_lists')}</dd>
          <dt className="form-label pt-1">{t('dl_term_marking')}</dt>
          <dd className="flex flex-col gap-2">
            <p>{t('dl_marking_1')}</p>
            <p>{t('dl_marking_2')}</p>
          </dd>
          <dt className="form-label pt-1">{t('dl_term_retakes')}</dt>
          <dd>{t('dl_retakes')}</dd>
          <dt className="form-label truncate pt-1" title={t('dl_term_truncated')}>
            {t('dl_term_truncated')}
          </dt>
          <dd>{t('dl_truncated')}</dd>
          <dt className="form-label pt-1">{t('dl_term_nesting')}</dt>
          <dd>
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_2fr]">
              <dt className="form-label pt-1">{t('dl_term_nested')}</dt>
              <dd>{t('dl_nested')}</dd>
            </dl>
          </dd>
        </dl>
      </DemoCard>
    </>
  );
}
