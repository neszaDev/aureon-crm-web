import { ChevronsRightIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Fragment } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from '@/libs/I18nNavigation';

export default async function BreadcrumbsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'BreadcrumbsPage' });

  const custom = [
    { id: 'added', label: t('custom_added') },
    { id: 'custom', label: t('custom_custom') },
  ];

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('card_title')} description={t('card_description')}>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2" aria-labelledby="crumbs-plain">
            <h3 id="crumbs-plain" className="form-label">
              {t('plain_title')}
            </h3>
            <Breadcrumb aria-label={t('plain_title')}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/">{t('plain_admin')}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/test-results/">{t('plain_manage')}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('plain_library')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </section>

          <section className="flex flex-col gap-2" aria-labelledby="crumbs-links">
            <h3 id="crumbs-links" className="form-label">
              {t('links_title')}
            </h3>
            <Breadcrumb aria-label={t('links_title')}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/">{t('links_dashboard')}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/widgets/">{t('links_widgets')}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="https://www.google.com">{t('links_google')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('links_current')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </section>

          <section className="flex flex-col gap-2" aria-labelledby="crumbs-custom">
            <h3 id="crumbs-custom" className="form-label">
              {t('custom_title')}
            </h3>
            <Breadcrumb aria-label={t('custom_title')}>
              <BreadcrumbList className="gap-2 text-lg font-semibold">
                {custom.map((crumb) => (
                  <Fragment key={crumb.id}>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#crumbs-custom" className="text-folder">
                        {crumb.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-pass [&>svg]:size-4.5">
                      <ChevronsRightIcon />
                    </BreadcrumbSeparator>
                  </Fragment>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold text-ink-950">
                    {t('custom_classes')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </section>
        </div>
      </DemoCard>
    </>
  );
}
