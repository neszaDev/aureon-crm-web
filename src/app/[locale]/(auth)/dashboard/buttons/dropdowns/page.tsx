import { SearchIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { ButtonGroup } from '@/components/showcase/buttons/ButtonGroup';
import { MenuButton } from '@/components/showcase/buttons/MenuButton';
import { CARD_VARIANTS } from '@/components/showcase/buttons/variants';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default async function DropdownsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DropdownsPage' });
  const tVariant = await getTranslations({ locale, namespace: 'ButtonVariants' });

  const actions = (
    <>
      <DropdownMenuItem>{t('action')}</DropdownMenuItem>
      <DropdownMenuItem>{t('another_action')}</DropdownMenuItem>
      <DropdownMenuItem>{t('something_else')}</DropdownMenuItem>
    </>
  );
  const numbered = (
    <>
      <DropdownMenuItem>{t('first_action')}</DropdownMenuItem>
      <DropdownMenuItem>{t('second_action')}</DropdownMenuItem>
      <DropdownMenuItem>{t('third_action')}</DropdownMenuItem>
    </>
  );

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 md:grid-cols-2">
        <DemoCard title={t('basic_title')} contentClassName="flex flex-col items-start gap-4">
          <MenuButton label={t('dropdown_button')}>
            {numbered}
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('something_else')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('disabled_action')}</DropdownMenuItem>
          </MenuButton>
          <MenuButton label={t('with_divider')}>
            <DropdownMenuItem>{t('first_item')}</DropdownMenuItem>
            <DropdownMenuItem>{t('second_item')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('separated_item')}</DropdownMenuItem>
          </MenuButton>
          <MenuButton label={t('with_header')}>
            <DropdownMenuLabel>{t('header')}</DropdownMenuLabel>
            <DropdownMenuItem>{t('first_item')}</DropdownMenuItem>
            <DropdownMenuItem>{t('second_item')}</DropdownMenuItem>
          </MenuButton>
        </DemoCard>

        <DemoCard
          title={t('positioning_title')}
          description={t('positioning_description')}
          contentClassName="flex flex-col items-start gap-4"
        >
          <div className="flex flex-wrap gap-3">
            <MenuButton label={t('left_align')} variant="default">
              {actions}
            </MenuButton>
            <MenuButton label={t('right_align')} variant="default" align="end">
              {actions}
            </MenuButton>
          </div>
          <MenuButton label={t('drop_up')} variant="secondary" side="top">
            {actions}
          </MenuButton>
          <MenuButton label={t('offset')} sideOffset={5} alignOffset={10}>
            {actions}
          </MenuButton>
          <ButtonGroup label={t('split')}>
            <MenuButton label={t('split')} split>
              {actions}
            </MenuButton>
          </ButtonGroup>
        </DemoCard>

        <DemoCard title={t('caret_title')} description={t('caret_description')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-lg" aria-label={t('search')}>
                <SearchIcon className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto min-w-44">{actions}</DropdownMenuContent>
          </DropdownMenu>
        </DemoCard>

        <DemoCard title={t('sizing_title')} contentClassName="flex flex-col items-start gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <MenuButton label={t('large')} size="lg">
              {actions}
            </MenuButton>
            <ButtonGroup label={t('large_split')}>
              <MenuButton label={t('large_split')} size="lg" split>
                {actions}
              </MenuButton>
            </ButtonGroup>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MenuButton label={t('small')} size="sm">
              {actions}
            </MenuButton>
            <ButtonGroup label={t('small_split')}>
              <MenuButton label={t('small_split')} size="sm" split>
                {actions}
              </MenuButton>
            </ButtonGroup>
          </div>
        </DemoCard>

        <DemoCard title={t('aria_title')} description={t('aria_description')}>
          <MenuButton label={t('aria_button')} variant="default">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('groups')}</DropdownMenuLabel>
              <DropdownMenuItem>{t('add_group')}</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">{t('delete_group')}</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('users')}</DropdownMenuLabel>
              <DropdownMenuItem>{t('add_user')}</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">{t('delete_user')}</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {t.rich('not_associated', { strong: (chunks) => <strong>{chunks}</strong> })}
            </DropdownMenuItem>
          </MenuButton>
        </DemoCard>

        <DemoCard
          title={t('variants_title')}
          description={t('variants_description')}
          contentClassName="flex flex-wrap items-center gap-2"
        >
          {CARD_VARIANTS.map((variant) => (
            <MenuButton
              key={variant}
              label={tVariant(variant)}
              variant={variant}
              size="sm"
              className={variant === 'link' ? 'px-2' : undefined}
            >
              {numbered}
            </MenuButton>
          ))}
        </DemoCard>
      </div>
    </>
  );
}
