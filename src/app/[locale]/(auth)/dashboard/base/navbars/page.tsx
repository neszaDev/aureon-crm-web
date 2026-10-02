import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import {
  Navbar,
  NavbarBrand,
  NavbarGroup,
  NavbarLink,
  NavbarMenu,
  NavbarSearch,
  NavbarText,
} from '@/components/showcase/base/Navbar';
import { DemoCard } from '@/components/showcase/DemoCard';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Toaster } from '@/components/ui/sonner';

// Language codes are data: they read the same in every locale.
const LANGUAGES = ['EN', 'ES', 'RU', 'FA'];

export default async function NavbarsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NavbarsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('main_title')} description={t('main_description')}>
        <Navbar
          tone="folder"
          label={t('main_title')}
          expand="md"
          brand={<NavbarBrand href="/dashboard/">{t('brand')}</NavbarBrand>}
        >
          <NavbarGroup>
            <NavbarLink tone="folder" href="/dashboard/test-results/">
              {t('link')}
            </NavbarLink>
            <NavbarLink tone="folder" href="/dashboard/" disabled>
              {t('disabled')}
            </NavbarLink>
          </NavbarGroup>
          <NavbarGroup end>
            <NavbarSearch tone="folder" placeholder={t('search')} button={t('search')} />
            <NavbarMenu tone="folder" label={t('lang')} choices={LANGUAGES} />
            <NavbarMenu
              tone="folder"
              label={t('user')}
              items={[
                { label: t('profile'), href: '/dashboard/account/' },
                { label: t('sign_out'), signOut: true },
              ]}
            />
          </NavbarGroup>
        </Navbar>
      </DemoCard>

      <DemoCard title={t('brand_title')}>
        <Navbar
          tone="paper"
          label={t('brand_title')}
          brand={
            <NavbarBrand href="/dashboard/">
              <Image
                src="/assets/images/mfu-logo.svg"
                alt=""
                width={18}
                height={30}
                className="h-7.5 w-auto"
              />
              {t('brand')}
            </NavbarBrand>
          }
        />
      </DemoCard>

      <DemoCard title={t('text_title')}>
        <Navbar
          tone="paper"
          label={t('text_title')}
          expand="sm"
          brand={<NavbarBrand>{t('brand')}</NavbarBrand>}
        >
          <NavbarText tone="paper">{t('navbar_text')}</NavbarText>
        </Navbar>
      </DemoCard>

      <DemoCard title={t('dropdown_title')}>
        <Navbar tone="folder" label={t('dropdown_title')} expand="sm">
          <NavbarGroup>
            <NavbarLink tone="folder" href="/dashboard/">
              {t('home')}
            </NavbarLink>
            <NavbarLink tone="folder" href="/dashboard/test-results/">
              {t('link')}
            </NavbarLink>
            <NavbarMenu tone="folder" label={t('lang')} choices={LANGUAGES} />
            <NavbarMenu
              tone="folder"
              label={t('user')}
              items={[
                { label: t('account'), href: '/dashboard/account/' },
                { label: t('settings'), href: '/dashboard/account/' },
              ]}
            />
          </NavbarGroup>
        </Navbar>
      </DemoCard>

      <DemoCard title={t('form_title')}>
        <Navbar tone="paper" label={t('form_title')}>
          <NavbarSearch tone="paper" placeholder={t('search')} button={t('search')} />
        </Navbar>
      </DemoCard>

      <DemoCard title={t('input_title')}>
        <Navbar tone="paper" label={t('input_title')}>
          <InputGroup className="h-9 w-full bg-ply sm:w-64">
            <InputGroupAddon>
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput aria-label={t('username')} placeholder={t('username')} />
          </InputGroup>
        </Navbar>
      </DemoCard>

      <Toaster />
    </>
  );
}
