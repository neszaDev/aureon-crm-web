import { BellIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

const HEADINGS = [
  { Tag: 'h2', className: 'text-[2rem] font-bold tracking-[-0.02em]' },
  { Tag: 'h3', className: 'text-2xl font-bold tracking-[-0.015em]' },
  { Tag: 'h4', className: 'text-xl font-semibold tracking-[-0.01em]' },
  { Tag: 'h5', className: 'text-lg font-semibold tracking-[-0.01em]' },
  { Tag: 'h6', className: 'text-base font-semibold' },
] as const;

export default async function BadgesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'BadgesPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 md:grid-cols-2">
        <DemoCard
          title={t('headings_title')}
          description={t('headings_description')}
          contentClassName="flex flex-col gap-3"
        >
          {HEADINGS.map((heading) => (
            <heading.Tag
              key={heading.Tag}
              className={`flex flex-wrap items-center gap-2 text-ink-950 ${heading.className}`}
            >
              {t('example_heading')}
              <Badge>{t('new')}</Badge>
            </heading.Tag>
          ))}
          <div className="mt-2 border-t border-ink-200 pt-4">
            <Button>
              <BellIcon data-icon="inline-start" />
              {t('notifications')}
              <Badge
                variant="outline"
                className="ml-1 h-5 border-folder-ink/40 px-1.5 text-folder-ink tabular-nums"
              >
                {t('notification_count', { count: 4 })}
              </Badge>
            </Button>
          </div>
        </DemoCard>

        <div className="flex flex-col gap-8">
          <DemoCard
            title={t('variants_title')}
            description={t('variants_description')}
            contentClassName="flex flex-wrap gap-2"
          >
            {VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant}>
                {t(`variant_${variant}`)}
              </Badge>
            ))}
          </DemoCard>

          <DemoCard
            title={t('pill_title')}
            description={t('pill_description')}
            contentClassName="flex flex-wrap gap-2"
          >
            {VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant} className="rounded-full">
                {t(`variant_${variant}`)}
              </Badge>
            ))}
          </DemoCard>

          <DemoCard
            title={t('links_title')}
            description={t('links_description')}
            contentClassName="flex flex-wrap gap-2"
          >
            {VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant} asChild>
                <a href={`#badge-${variant}`} id={`badge-${variant}`}>
                  {t(`variant_${variant}`)}
                </a>
              </Badge>
            ))}
          </DemoCard>
        </div>
      </div>
    </>
  );
}
