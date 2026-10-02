import { flagSet } from '@coreui/icons';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { CoreuiIcon } from '@/components/showcase/icons/CoreuiIcon';
import { readGalleryParams, searchNames, toKebabCase } from '@/components/showcase/icons/gallery';
import { IconGallery } from '@/components/showcase/icons/IconGallery';

// Read on the server only: just one page of flags reaches the browser.
const FLAGS = new Map(Object.entries(flagSet).map(([key, icon]) => [toKebabCase(key), icon]));
const NAMES = [...FLAGS.keys()];
const PAGE_SIZE = 48;

type FlagsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

export default async function FlagsPage(props: FlagsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'FlagsPage' });
  const params = readGalleryParams(await props.searchParams);
  const result = searchNames(NAMES, { ...params, pageSize: PAGE_SIZE });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('gallery_title')} description={t('gallery_description')}>
        <IconGallery
          query={params.query}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          path="/dashboard/icons/flags"
          items={result.names.map((name) => ({
            name,
            icon: (
              <CoreuiIcon
                icon={FLAGS.get(name) ?? []}
                name={name}
                className="h-10 w-auto max-w-full outline outline-ink-200"
              />
            ),
          }))}
        />
      </DemoCard>
    </>
  );
}
