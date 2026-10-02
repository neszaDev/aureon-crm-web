import {
  BellIcon,
  CalculatorIcon,
  ChartLineIcon,
  ChartPieIcon,
  ClipboardListIcon,
  CodeIcon,
  FileWarningIcon,
  FilterIcon,
  LanguagesIcon,
  LayersIcon,
  LayoutGridIcon,
  MapIcon,
  MousePointerClickIcon,
  NotebookPenIcon,
  PaletteIcon,
  PlugIcon,
  PuzzleIcon,
  QrCodeIcon,
  SchoolIcon,
  StarIcon,
  TableIcon,
  TypeIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** A link in the app sidebar. */
export type NavLink = { href: string; label: string; icon?: LucideIcon };

/** A collapsible group of links, open while the current path is inside `base`. */
export type NavGroup = { base: string; label: string; icon: LucideIcon; items: NavLink[] };

/** A titled block of the sidebar. */
export type NavSection = { id: string; title?: string; entries: (NavLink | NavGroup)[] };

const sub = (base: string, slugs: [string, string][]): NavLink[] =>
  slugs.map(([slug, label]) => ({ href: `${base}/${slug}`, label }));

/**
 * The sidebar, translated: the product's own pages, then the sections of the original Vue
 * admin app.
 * @returns The sections in display order.
 */
export const useNavSections = (): NavSection[] => {
  const t = useTranslations('AppNav');

  return [
    {
      id: 'main',
      entries: [
        { href: '/dashboard', label: t('dashboard'), icon: LayoutGridIcon },
        { href: '/dashboard/test-results', label: t('test_results'), icon: ClipboardListIcon },
        { href: '/dashboard/account', label: t('account'), icon: UserRoundIcon },
      ],
    },
    {
      id: 'section_campus',
      title: t('section_campus'),
      entries: [
        { href: '/dashboard/campus', label: t('campus'), icon: SchoolIcon },
        { href: '/dashboard/campus/filters', label: t('campus_filters'), icon: FilterIcon },
        { href: '/dashboard/campus/content', label: t('campus_content'), icon: LanguagesIcon },
        { href: '/dashboard/campus/qr-code', label: t('campus_qr_code'), icon: QrCodeIcon },
      ],
    },
    {
      id: 'section_theme',
      title: t('section_theme'),
      entries: [
        { href: '/dashboard/theme/colors', label: t('colors'), icon: PaletteIcon },
        { href: '/dashboard/theme/typography', label: t('typography'), icon: TypeIcon },
      ],
    },
    {
      id: 'section_components',
      title: t('section_components'),
      entries: [
        {
          base: '/dashboard/base',
          label: t('base'),
          icon: PuzzleIcon,
          items: sub('/dashboard/base', [
            ['breadcrumbs', t('breadcrumbs')],
            ['cards', t('cards')],
            ['carousels', t('carousels')],
            ['collapses', t('collapses')],
            ['jumbotrons', t('jumbotrons')],
            ['list-groups', t('list_groups')],
            ['navs', t('navs')],
            ['navbars', t('navbars')],
            ['paginations', t('paginations')],
            ['popovers', t('popovers')],
            ['progress-bars', t('progress_bars')],
            ['switches', t('switches')],
            ['tabs', t('tabs')],
            ['tooltips', t('tooltips')],
          ]),
        },
        {
          base: '/dashboard/buttons',
          label: t('buttons'),
          icon: MousePointerClickIcon,
          items: sub('/dashboard/buttons', [
            ['standard-buttons', t('standard_buttons')],
            ['dropdowns', t('button_dropdowns')],
            ['button-groups', t('button_groups')],
            ['brand-buttons', t('brand_buttons')],
          ]),
        },
        { href: '/dashboard/charts', label: t('charts'), icon: ChartPieIcon },
        {
          base: '/dashboard/editors',
          label: t('editors'),
          icon: CodeIcon,
          items: sub('/dashboard/editors', [
            ['code-editors', t('code_editors')],
            ['text-editors', t('text_editors')],
          ]),
        },
        {
          base: '/dashboard/forms',
          label: t('forms'),
          icon: NotebookPenIcon,
          items: sub('/dashboard/forms', [
            ['basic-forms', t('basic_forms')],
            ['advanced-forms', t('advanced_forms')],
            ['validation-forms', t('validation_forms')],
          ]),
        },
        { href: '/dashboard/google-maps', label: t('google_maps'), icon: MapIcon },
        {
          base: '/dashboard/icons',
          label: t('icons'),
          icon: StarIcon,
          items: sub('/dashboard/icons', [
            ['coreui-icons', t('icon_library')],
            ['brands', t('brands')],
            ['flags', t('flags')],
          ]),
        },
        {
          base: '/dashboard/notifications',
          label: t('notifications'),
          icon: BellIcon,
          items: sub('/dashboard/notifications', [
            ['alerts', t('alerts')],
            ['badges', t('badges')],
            ['modals', t('modals')],
            ['toaster', t('toaster')],
          ]),
        },
        {
          base: '/dashboard/plugins',
          label: t('plugins'),
          icon: PlugIcon,
          items: sub('/dashboard/plugins', [
            ['draggable', t('draggable')],
            ['calendar', t('calendar')],
            ['spinners', t('spinners')],
          ]),
        },
        {
          base: '/dashboard/tables',
          label: t('tables'),
          icon: TableIcon,
          items: sub('/dashboard/tables', [
            ['tables', t('basic_tables')],
            ['advanced-tables', t('advanced_tables')],
          ]),
        },
        { href: '/dashboard/widgets', label: t('widgets'), icon: CalculatorIcon },
      ],
    },
    {
      id: 'section_extras',
      title: t('section_extras'),
      entries: [
        { href: '/dashboard/analytics', label: t('analytics'), icon: ChartLineIcon },
        { href: '/dashboard/users', label: t('users'), icon: UsersIcon },
        {
          base: '/dashboard/pages',
          label: t('pages'),
          icon: FileWarningIcon,
          items: sub('/dashboard/pages', [
            ['404', t('error_404')],
            ['500', t('error_500')],
          ]),
        },
        {
          base: '/dashboard/apps',
          label: t('apps'),
          icon: LayersIcon,
          items: [
            { href: '/dashboard/apps/invoicing/invoice', label: t('invoice') },
            ...sub('/dashboard/apps/email', [
              ['inbox', t('inbox')],
              ['message', t('message')],
              ['compose', t('compose')],
            ]),
          ],
        },
      ],
    },
  ];
};
