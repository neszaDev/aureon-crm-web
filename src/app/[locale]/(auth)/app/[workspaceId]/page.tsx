import { ChevronRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { initialsOf, Seal } from '@/components/crm/Seal';
import { StampBox } from '@/components/crm/StampBox';
import { getMembers, getWorkspace } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { can } from '@/libs/crm/Permissions';
import { Link } from '@/libs/I18nNavigation';

type WorkspacePageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

const MEMBERS_SHOWN = 8;

export async function generateMetadata(props: WorkspacePageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  // The layout shows ForbiddenNotice instead of the page on a 403 (the same, cached call).
  const { forbidden } = await getWorkspace(workspaceId);
  if (forbidden) {
    const tForbidden = await getTranslations({ locale, namespace: 'ForbiddenNotice' });
    return { title: tForbidden('title') };
  }
  const t = await getTranslations({ locale, namespace: 'WorkspacePage' });

  return { title: t('title') };
}

// shortcut: a welcome with next steps stands in for the dashboard; F3 replaces it with the KPI
// strip, deals with stamp rows and follow-ups.
export default async function WorkspacePage(props: WorkspacePageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'WorkspacePage' });
  const tRole = await getTranslations({ locale, namespace: 'Roles' });

  // The user and the workspace (cached calls); a lost workspace is "not found" even on a
  // client navigation, which renders the page without its layout.
  const [{ user }, { workspace }, members] = await Promise.all([
    getCurrentUser(),
    getOpenWorkspace(locale, workspaceId),
    getMembers(workspaceId),
  ]);
  if (members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!user || !workspace || (!members.members && !members.forbidden)) {
    throw new Error('Could not load the workspace members');
  }

  const base = `/app/${workspace.id}/settings`;
  // Your next steps: the ones you completed carry your seal.
  const sealOfUser = initialsOf(user.displayName, user.email ?? '');
  const memberCount = members.members?.length ?? 0;
  const steps = [
    {
      key: 'profile' as const,
      href: `${base}/profile`,
      done: Boolean(user.displayName),
      show: true,
    },
    {
      key: 'team' as const,
      href: `${base}/members`,
      done: memberCount > 1,
      show: can(workspace, 'MEMBERS_MANAGE'),
    },
    {
      key: 'pipeline' as const,
      href: `${base}/pipeline`,
      done: false,
      show: can(workspace, 'SETTINGS_MANAGE'),
    },
    {
      key: 'sources' as const,
      href: `${base}/sources`,
      done: false,
      show: can(workspace, 'SETTINGS_MANAGE'),
    },
    {
      key: 'roles' as const,
      href: `${base}/roles`,
      done: false,
      show: !can(workspace, 'SETTINGS_MANAGE'),
    },
  ].filter((step) => step.show);
  const currencyName = workspace.defaultCurrency
    ? new Intl.DisplayNames(locale, { type: 'currency' }).of(workspace.defaultCurrency)
    : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.01em] break-words">
          {t('heading', { name: workspace.name ?? '' })}
        </h1>
        <p className="text-muted-foreground">{t('intro')}</p>
      </header>

      <dl className="grid overflow-hidden rounded-lg border border-rule bg-card sm:grid-cols-3">
        <div className="border-b border-rule px-5 py-3.5 sm:border-r sm:border-b-0">
          <dt className="text-[0.8125rem] text-muted-foreground">{t('fact_role')}</dt>
          <dd className="mt-0.5 text-lg font-semibold">
            {workspace.role && tRole(`role_${workspace.role}`)}
          </dd>
        </div>
        <div className="border-b border-rule px-5 py-3.5 sm:border-r sm:border-b-0">
          <dt className="text-[0.8125rem] text-muted-foreground">{t('fact_currency')}</dt>
          <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-semibold">{workspace.defaultCurrency}</span>
            <span className="text-sm text-muted-foreground">{currencyName}</span>
          </dd>
        </div>
        <div className="px-5 py-3.5">
          <dt className="text-[0.8125rem] text-muted-foreground">{t('fact_timezone')}</dt>
          <dd className="mt-0.5 text-lg font-semibold break-words">
            {workspace.timezone?.replaceAll('_', ' ')}
          </dd>
        </div>
      </dl>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="steps-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-5 pt-4 pb-3">
            <h2 id="steps-heading" className="font-semibold">
              {t('steps_title')}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {t('steps_progress', {
                done: steps.filter((step) => step.done).length,
                total: steps.length,
              })}
            </span>
          </div>
          <ol>
            {steps.map((step) => (
              <li key={step.key} className="border-t border-rule">
                <Link
                  href={step.href}
                  className="group flex items-center gap-3.5 px-5 py-3 no-underline transition-colors duration-150 hover:bg-muted focus-visible:-outline-offset-2"
                >
                  {/* The stamp box: empty until the step is done, then signed with your seal. */}
                  <StampBox seal={step.done ? sealOfUser : undefined}>
                    <span className="sr-only">{step.done ? t('step_done') : t('step_todo')}</span>
                  </StampBox>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {t(`step_${step.key}_title`)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t(`step_${step.key}_text`)}
                    </span>
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="members-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
            <h2 id="members-heading" className="font-semibold">
              {t('members_title')}
            </h2>
            {members.members && (
              <span className="text-sm text-muted-foreground tabular-nums">{memberCount}</span>
            )}
          </div>
          {members.members ? (
            <ul>
              {members.members.slice(0, MEMBERS_SHOWN).map((member) => (
                <li
                  key={member.userId}
                  className="flex min-h-12 items-center gap-3 border-t border-rule px-5 py-2"
                >
                  <Seal name={member.displayName} email={member.email ?? ''} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[0.9375rem] font-medium">
                      {member.displayName ?? member.email}
                      {member.email === user.email && (
                        <span className="font-normal text-muted-foreground"> · {t('you')}</span>
                      )}
                    </span>
                    {member.displayName && (
                      <span className="truncate text-sm text-muted-foreground">{member.email}</span>
                    )}
                  </span>
                  {member.role && (
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {tRole(`role_${member.role}`)}
                    </span>
                  )}
                </li>
              ))}
              {memberCount > MEMBERS_SHOWN && (
                <li className="border-t border-rule px-5 py-3 text-sm text-muted-foreground">
                  {t('members_more', { count: memberCount - MEMBERS_SHOWN })}
                </li>
              )}
            </ul>
          ) : (
            <div className="border-t border-rule p-4">
              <ForbiddenNotice />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
