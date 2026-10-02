import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FilesTable } from '@/components/files/FilesTable';
import { UploadFileForm } from '@/components/files/UploadFileForm';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listFiles } from '@/libs/api/Queries';
import { redirect } from '@/libs/I18nNavigation';

const PAGE_SIZE = 20;

type FilesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function FilesPage(props: FilesPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'FilesPage' });
  const searchParams = await props.searchParams;
  const page = Math.max(Math.trunc(Number(searchParams.page ?? '0')) || 0, 0);

  const { files, unauthorized } = await listFiles(page, PAGE_SIZE);
  if (unauthorized) {
    return redirect({ href: '/sign-in', locale });
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="xl:sticky xl:top-12 xl:col-start-2 xl:row-start-1">
          <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
            <CardTitle>
              <h2>{t('upload_title')}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadFileForm />
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0 xl:col-start-1 xl:row-start-1">
          <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
            <CardTitle>
              <h2>{t('list_title')}</h2>
            </CardTitle>
          </CardHeader>
          <div className="px-2 sm:px-3">
            <FilesTable rows={files?.content ?? []} />
          </div>
          <Pagination
            page={page}
            totalPages={files?.totalPages ?? 0}
            href={(target) => `/dashboard/files?page=${target}`}
          />
        </Card>
      </div>
    </>
  );
}
