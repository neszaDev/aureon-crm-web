import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CreateWorkspaceForm } from '@/components/crm/CreateWorkspaceForm';
import { PickerFrame } from '@/components/crm/shell/PickerFrame';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/libs/api/Queries';
import { Link } from '@/libs/I18nNavigation';

type NewWorkspacePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: NewWorkspacePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewWorkspacePage' });

  return { title: t('title') };
}

export default async function NewWorkspacePage(props: NewWorkspacePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewWorkspacePage' });
  const tShell = await getTranslations({ locale, namespace: 'CrmShell' });
  // The layout has checked the session; this is the same, cached call.
  const { user } = await getCurrentUser();

  return (
    <PickerFrame user={user}>
      <Button asChild variant="ghost" size="sm" className="-ml-3 self-start">
        <Link href="/app">
          <ArrowLeftIcon data-icon="inline-start" />
          {tShell('all_workspaces')}
        </Link>
      </Button>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-[-0.01em]">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <section className="rounded-lg border border-rule bg-card p-5 shadow-sheet sm:p-7">
        <CreateWorkspaceForm />
      </section>
    </PickerFrame>
  );
}
