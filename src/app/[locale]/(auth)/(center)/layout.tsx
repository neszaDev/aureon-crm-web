import { ArrowLeftIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Mark } from '@/components/report/Mark';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { Link } from '@/libs/I18nNavigation';
import type { TestStatus } from '@/validations/TestResultValidation';

const KEY_ORDER: TestStatus[] = ['PASSED', 'FAILED', 'PENDING'];

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AuthLayout' });
  const tStatus = await getTranslations({ locale, namespace: 'TestResultForm' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* The folder side: the key to the marks, large. */}
      <aside className="hidden flex-col justify-between gap-12 bg-folder p-10 text-folder-ink lg:flex xl:p-14">
        <Wordmark tone="folder" />
        <div className="flex flex-col gap-10">
          <ul className="flex flex-col gap-5" aria-hidden="true">
            {KEY_ORDER.map((status) => (
              <li key={status} className="flex items-center gap-5">
                <span className="grid size-16 place-items-center rounded-md bg-paper-card shadow-paper">
                  <Mark status={status} className="size-10" />
                </span>
                <span className="text-2xl font-bold tracking-[-0.02em]">
                  {tStatus(`status_${status}`)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex max-w-sm flex-col gap-3">
            <p className="text-3xl leading-tight font-extrabold tracking-[-0.03em]">
              {t('aside_title')}
            </p>
            <p className="text-lg leading-relaxed text-folder-ink-soft">{t('aside_text')}</p>
          </div>
        </div>
        <p className="max-w-sm text-sm text-folder-ink-soft">{tBrand('sample_note')}</p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Wordmark className="lg:hidden" />
          <Button asChild variant="ghost" size="sm" className="max-lg:hidden">
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('back_home')}
            </Link>
          </Button>
          <LocaleSwitcher />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pt-6 pb-16 sm:px-8">
          <div className="w-full max-w-[25rem]">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
