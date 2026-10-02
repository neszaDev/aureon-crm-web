import { ExternalLinkIcon, icons } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createElement } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { readGalleryParams, searchNames } from '@/components/showcase/icons/gallery';
import { IconGallery } from '@/components/showcase/icons/IconGallery';
import { Button } from '@/components/ui/button';

// The whole Lucide set, read on the server only: just one page of icons reaches the browser.
const ICONS = new Map(Object.entries(icons));
const NAMES = [...ICONS.keys()];
const PAGE_SIZE = 96;

type CoreuiIconsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

export default async function CoreuiIconsPage(props: CoreuiIconsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CoreuiIconsPage' });
  const params = readGalleryParams(await props.searchParams);
  const result = searchNames(NAMES, { ...params, pageSize: PAGE_SIZE });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard
        title={t('gallery_title')}
        description={t('gallery_description')}
        action={
          <Button asChild variant="link" size="sm">
            <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer noopener">
              {t('website')}
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        }
      >
        <IconGallery
          query={params.query}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          path="/dashboard/icons/coreui-icons"
          items={result.names.flatMap((name) => {
            const icon = ICONS.get(name);
            return icon
              ? [{ name, icon: createElement(icon, { className: 'size-6', 'aria-hidden': true }) }]
              : [];
          })}
        />
      </DemoCard>
    </>
  );
}
