import { BellIcon, MailIcon, SettingsIcon, ShoppingBasketIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import type { NavItem } from '@/components/showcase/base/NavDemo';
import { NavDemo } from '@/components/showcase/base/NavDemo';
import { DemoCard } from '@/components/showcase/DemoCard';

export default async function NavsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NavsPage' });

  const basic: NavItem[] = [
    { id: 'active', label: t('item_active') },
    { id: 'link', label: t('item_link') },
    { id: 'another', label: t('item_another') },
    { id: 'disabled', label: t('item_disabled'), disabled: true },
  ];
  const long: NavItem[] = [
    { id: 'active', label: t('item_active') },
    { id: 'link', label: t('item_link') },
    { id: 'long', label: t('item_long') },
    { id: 'disabled', label: t('item_disabled'), disabled: true },
  ];
  const icons: NavItem[] = [
    { id: 'basket', label: t('icon_basket'), icon: <ShoppingBasketIcon className="size-4" /> },
    { id: 'settings', label: t('icon_settings'), icon: <SettingsIcon className="size-4" /> },
    { id: 'bell', label: t('icon_bell'), icon: <BellIcon className="size-4" /> },
    {
      id: 'mail',
      label: t('icon_mail'),
      icon: <MailIcon className="size-4" />,
      disabled: true,
    },
  ];

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('basic_title')} description={t('basic_description')}>
        <NavDemo label={t('basic_title')} items={basic} defaultActive="active" />
      </DemoCard>

      <DemoCard title={t('icons_title')}>
        <NavDemo label={t('icons_title')} items={icons} variant="pills" defaultActive="basket" />
      </DemoCard>

      <DemoCard title={t('tabs_title')}>
        <NavDemo label={t('tabs_title')} items={basic} variant="tabs" defaultActive="active" />
      </DemoCard>

      <DemoCard title={t('pills_title')}>
        <NavDemo label={t('pills_title')} items={basic} variant="pills" defaultActive="active" />
      </DemoCard>

      <DemoCard title={t('fill_title')} description={t('fill_description')}>
        <NavDemo label={t('fill_title')} items={long} variant="tabs" defaultActive="active" fill />
      </DemoCard>

      <DemoCard title={t('justified_title')} description={t('justified_description')}>
        <NavDemo
          label={t('justified_title')}
          items={long}
          variant="tabs"
          defaultActive="active"
          justified
        />
      </DemoCard>

      <DemoCard title={t('dropdown_title')}>
        <NavDemo
          label={t('dropdown_title')}
          items={basic.slice(0, 2)}
          variant="pills"
          dropdown={{
            label: t('dropdown_label'),
            groups: [[t('dropdown_one'), t('dropdown_two')], [t('dropdown_three')]],
          }}
        />
      </DemoCard>

      <DemoCard title={t('vertical_title')}>
        <div className="max-w-56">
          <NavDemo
            label={t('vertical_title')}
            items={basic}
            variant="pills"
            defaultActive="active"
            vertical
          />
        </div>
      </DemoCard>
    </>
  );
}
