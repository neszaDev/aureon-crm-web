import {
  ArrowRightIcon,
  BellIcon,
  ChartPieIcon,
  GaugeIcon,
  LaptopIcon,
  MessageSquareIcon,
  MoonIcon,
  SettingsIcon,
  ShoppingBasketIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import {
  ICON_TONES,
  PROGRESS_ICON_WIDGETS,
  ROW_TONES,
  SALES_POINTS,
  SIMPLE_WIDGETS,
} from '@/components/showcase/widgets/data';
import { Sparkline } from '@/components/showcase/widgets/Sparkline';
import { toneColor } from '@/components/showcase/widgets/tones';
import {
  IconWidget,
  ProgressIconWidget,
  ProgressWidget,
  SimpleWidget,
} from '@/components/showcase/widgets/WidgetCards';
import { WidgetsBrand } from '@/components/showcase/widgets/WidgetsBrand';
import { WidgetsDropdown } from '@/components/showcase/widgets/WidgetsDropdown';
import { Link } from '@/libs/I18nNavigation';

const PROGRESS_VALUE = 25;
const ICONS = [
  { id: 'settings', Icon: SettingsIcon },
  { id: 'laptop', Icon: LaptopIcon },
  { id: 'moon', Icon: MoonIcon },
  { id: 'bell', Icon: BellIcon },
];
const PROGRESS_ICONS = {
  visitors: UsersIcon,
  new_clients: UserPlusIcon,
  products_sold: ShoppingBasketIcon,
  returning: ChartPieIcon,
  avg_time: GaugeIcon,
  comments: MessageSquareIcon,
};

const Section = (props: { title: string; description: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-bold tracking-[-0.01em] text-ink-950">{props.title}</h2>
      <p className="text-[0.9375rem] text-ink-600">{props.description}</p>
    </div>
    {props.children}
  </section>
);

export default async function WidgetsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'WidgetsPage' });
  const format = await getFormatter({ locale });

  const progress = [
    {
      header: format.number(0.899, { style: 'percent', maximumFractionDigits: 1 }),
      text: t('progress_uptime'),
      footer: t('progress_uptime_note'),
    },
    {
      header: format.number(12_124),
      text: t('progress_orders'),
      footer: t('progress_orders_note'),
    },
    {
      header: format.number(98_111, { style: 'currency', currency: 'USD' }),
      text: t('progress_revenue'),
      footer: t('progress_revenue_note'),
    },
    {
      header: format.number(2, { style: 'unit', unit: 'terabyte' }),
      text: t('progress_storage'),
      footer: t('progress_storage_note'),
    },
  ];
  const income = format.number(1999.5, { style: 'currency', currency: 'USD' });
  const progressIcon = {
    visitors: { header: format.number(87_500), text: t('visitors') },
    new_clients: { header: format.number(385), text: t('new_clients') },
    products_sold: { header: format.number(1238), text: t('products_sold') },
    returning: { header: format.number(0.28, { style: 'percent' }), text: t('returning_visitors') },
    avg_time: { header: '5:34:11', text: t('avg_time') },
    comments: { header: format.number(972), text: t('comments') },
  };
  const simple = {
    sessions: t('simple_sessions'),
    sign_ups: t('simple_sign_ups'),
    downloads: t('simple_downloads'),
    orders: t('simple_orders'),
    refunds: t('simple_refunds'),
    reviews: t('simple_reviews'),
  };
  const groupWidgets = PROGRESS_ICON_WIDGETS.slice(0, 5);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section title={t('progress_title')} description={t('progress_description')}>
        {[false, true].map((inverse) => (
          <div key={String(inverse)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {progress.map((item, index) => (
              <ProgressWidget
                key={item.text}
                {...item}
                value={PROGRESS_VALUE}
                tone={ROW_TONES[index] ?? 'folder'}
                inverse={inverse}
              />
            ))}
          </div>
        ))}
      </Section>

      <Section title={t('icon_title')} description={t('icon_description')}>
        {(['padded', 'flush'] as const).map((layout) => (
          <div key={layout} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ICONS.map((item, index) => (
              <IconWidget
                key={item.id}
                header={income}
                text={t('income')}
                icon={<item.Icon />}
                tone={ICON_TONES[index] ?? 'folder'}
                layout={layout}
              />
            ))}
          </div>
        ))}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ICONS.slice(0, 3).map((item, index) => (
            <IconWidget
              key={item.id}
              header={income}
              text={t('income')}
              icon={<item.Icon />}
              tone={ICON_TONES[index] ?? 'folder'}
              layout="wide"
              footer={
                index === 2 ? (
                  <Link
                    href="/dashboard/analytics/"
                    className="flex items-center justify-between text-xs font-semibold text-ink-600 hover:text-ink-900"
                  >
                    {t('view_more')}
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </Link>
                ) : undefined
              }
            />
          ))}
        </div>
      </Section>

      <Section title={t('brand_title')} description={t('brand_description')}>
        <WidgetsBrand />
        <WidgetsBrand charts />
      </Section>

      <Section title={t('progress_icon_title')} description={t('progress_icon_description')}>
        {[false, true].map((inverse) => (
          <div
            key={String(inverse)}
            className="grid gap-px overflow-hidden rounded-sm border border-ink-200 bg-ink-200 shadow-sheet sm:grid-cols-2 lg:grid-cols-5"
          >
            {groupWidgets.map((widget) => {
              const Icon = PROGRESS_ICONS[widget.id];
              return (
                <ProgressIconWidget
                  key={widget.id}
                  {...progressIcon[widget.id]}
                  icon={<Icon />}
                  tone={widget.tone}
                  value={PROGRESS_VALUE}
                  inverse={inverse}
                  grouped
                />
              );
            })}
          </div>
        ))}
        {[false, true].map((inverse) => (
          <div
            key={String(inverse)}
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
          >
            {PROGRESS_ICON_WIDGETS.map((widget) => {
              const Icon = PROGRESS_ICONS[widget.id];
              return (
                <ProgressIconWidget
                  key={widget.id}
                  {...progressIcon[widget.id]}
                  icon={<Icon />}
                  tone={widget.tone}
                  value={PROGRESS_VALUE}
                  inverse={inverse}
                />
              );
            })}
          </div>
        ))}
      </Section>

      <Section title={t('dropdown_title')} description={t('dropdown_description')}>
        <WidgetsDropdown />
      </Section>

      <Section title={t('simple_title')} description={t('simple_description')}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SIMPLE_WIDGETS.map((widget) => (
            <SimpleWidget
              key={widget.id}
              header={simple[widget.id]}
              text={format.number(widget.value)}
            >
              <Sparkline
                kind={widget.kind}
                data={SALES_POINTS}
                name={simple[widget.id]}
                color={toneColor[widget.tone]}
                className="h-10"
              />
            </SimpleWidget>
          ))}
        </div>
      </Section>
    </>
  );
}
