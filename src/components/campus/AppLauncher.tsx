import { useTranslations } from 'next-intl';
import type { LauncherCategory } from './data';
import { badgeLabel } from './labels';

/**
 * The campus app launcher (Vue `MAppItem`): one sheet per category, its app count, and a grid
 * of app tiles with an unread badge capped at "99+".
 * @param props Component props.
 * @param props.categories Categories with their apps.
 * @returns The launcher.
 */
export const AppLauncher = (props: { categories: LauncherCategory[] }) => {
  const t = useTranslations('CampusLauncher');

  return (
    <div className="flex flex-col gap-4">
      {props.categories.map((category) => (
        <section
          key={category.id}
          aria-labelledby={`launcher-${category.id}`}
          className="rounded-sm border border-ink-200 bg-paper-card p-5 shadow-sheet"
        >
          <div className="flex items-center justify-between gap-4">
            <h3
              id={`launcher-${category.id}`}
              className="flex items-center gap-2 text-base font-semibold text-ink-950"
            >
              <category.icon aria-hidden="true" className="size-5 text-folder" />
              {t(`category_${category.name}`)}
            </h3>
            <span className="text-sm font-semibold text-ink-700 tabular-nums">
              {t('app_count', { count: category.apps.length })}
            </span>
          </div>
          <ul className="mt-5 grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
            {category.apps.map((app) => {
              const badge = badgeLabel(app.badge);

              return (
                <li key={app.id} className="flex flex-col items-center gap-2 text-center">
                  <span className="relative flex size-16 items-center justify-center rounded-lg border-2 border-ink-200 bg-ply text-ink-900 shadow-ply">
                    <app.icon aria-hidden="true" className="size-8" />
                    {badge && (
                      <span className="absolute -top-2.5 -right-2.5 min-w-6 rounded-full bg-pen px-1.5 py-0.5 text-xs font-bold text-white tabular-nums">
                        <span aria-hidden="true">{badge}</span>
                        <span className="sr-only">{t('notifications', { count: app.badge })}</span>
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{t(`app_${app.name}`)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
