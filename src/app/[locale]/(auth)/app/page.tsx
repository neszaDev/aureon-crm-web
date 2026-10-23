import { ChevronRightIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CreateWorkspaceForm } from '@/components/crm/CreateWorkspaceForm';
import { PickerFrame } from '@/components/crm/shell/PickerFrame';
import { WorkspaceMark } from '@/components/crm/WorkspaceMark';
import { Button } from '@/components/ui/button';
import { getMyWorkspaces } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { Link, redirect } from '@/libs/I18nNavigation';

type AppPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: AppPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AppPage' });

  return { title: t('title') };
}

// The CRM home: no workspace yet → create one; one → open it; several → pick one.
export default async function AppPage(props: AppPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AppPage' });
  const tRole = await getTranslations({ locale, namespace: 'Roles' });

  const [{ user }, { workspaces, unauthorized }] = await Promise.all([
    getCurrentUser(),
    getMyWorkspaces(),
  ]);
  if (unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspaces) {
    throw new Error('Could not load the workspaces');
  }
  const [only] = workspaces;
  if (workspaces.length === 1 && only) {
    return redirect({ href: `/app/${only.id}`, locale });
  }

  if (workspaces.length === 0) {
    return (
      <PickerFrame user={user}>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl leading-tight font-semibold tracking-[-0.01em]">
            {t('create_title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('create_text')}</p>
        </div>
        <section className="rounded-lg border border-rule bg-card p-5 sm:p-7">
          <CreateWorkspaceForm />
        </section>
      </PickerFrame>
    );
  }

  return (
    <PickerFrame user={user}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.01em]">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <ul className="overflow-hidden rounded-lg border border-rule bg-card">
        {workspaces.map((workspace) => (
          <li key={workspace.id} className="border-b border-rule last:border-b-0">
            <Link
              href={`/app/${workspace.id}`}
              className="group flex min-h-14 items-center gap-3 px-4 py-2.5 no-underline transition-colors duration-150 hover:bg-muted focus-visible:-outline-offset-2 sm:px-5"
            >
              <WorkspaceMark name={workspace.name} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold break-words text-foreground">
                  {workspace.name}
                </span>
                <span className="text-[0.8125rem] text-muted-foreground">
                  {tRole(`role_${workspace.role}`)}
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className="self-start">
        <Link href="/app/new">
          <PlusIcon data-icon="inline-start" />
          {t('new_link')}
        </Link>
      </Button>
    </PickerFrame>
  );
}
