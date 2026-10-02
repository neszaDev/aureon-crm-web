import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ItalicIcon,
  UnderlineIcon,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { ButtonGroup } from '@/components/showcase/buttons/ButtonGroup';
import { MenuButton } from '@/components/showcase/buttons/MenuButton';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const SIZES = ['default', 'sm', 'lg'] as const;
const TOOLBAR_SIZES = ['large', 'medium', 'small'] as const;

export default async function ButtonGroupsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ButtonGroupsPage' });
  const tVariant = await getTranslations({ locale, namespace: 'ButtonVariants' });

  const menuItems = (
    <>
      <DropdownMenuItem>{t('item', { number: 1 })}</DropdownMenuItem>
      <DropdownMenuItem>{t('item', { number: 2 })}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>{t('item', { number: 3 })}</DropdownMenuItem>
    </>
  );

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard
        title={t('basic_title')}
        description={t('basic_description')}
        contentClassName="flex flex-col gap-6"
      >
        <ButtonGroup label={t('numbers_label')}>
          <Button variant="outline">{t('one')}</Button>
          <Button variant="outline">{t('two')}</Button>
          <Button variant="outline">{t('three')}</Button>
          <Button variant="outline" className="max-md:rounded-r-md!">
            {t('four')}
          </Button>
          <Button variant="outline" className="max-md:hidden">
            {t('five')}
          </Button>
        </ButtonGroup>
        <ButtonGroup label={t('variants_label')}>
          <Button className="max-md:hidden">{tVariant('default')}</Button>
          <Button variant="secondary" className="max-md:rounded-l-md!">
            {tVariant('secondary')}
          </Button>
          <Button variant="outline" className="max-md:hidden">
            {tVariant('outline')}
          </Button>
          <Button variant="ghost">{tVariant('ghost')}</Button>
          <Button variant="destructive" className="max-md:hidden">
            {tVariant('destructive')}
          </Button>
          <Button variant="link" className="h-9 px-4">
            {tVariant('link')}
          </Button>
        </ButtonGroup>
      </DemoCard>

      <DemoCard title={t('sizing_title')} contentClassName="flex flex-col gap-6">
        {SIZES.map((size) => (
          <ButtonGroup key={size} label={t(`size_${size}`)}>
            <Button variant="outline" size={size}>
              {t('left')}
            </Button>
            <Button variant="outline" size={size}>
              {t('middle')}
            </Button>
            <Button variant="outline" size={size}>
              {t('right')}
            </Button>
          </ButtonGroup>
        ))}
      </DemoCard>

      <DemoCard title={t('dropdown_title')} description={t('dropdown_description')}>
        <ButtonGroup label={t('dropdown_label')}>
          <Button variant="outline" className="max-md:hidden">
            {t('button', { number: 1 })}
          </Button>
          <Button variant="outline" className="max-md:hidden">
            {t('button', { number: 2 })}
          </Button>
          <MenuButton
            label={t('menu')}
            variant="default"
            align="end"
            className="max-md:rounded-l-md!"
          >
            {menuItems}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t('more')}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>{t('item', { number: 4 })}</DropdownMenuItem>
                <DropdownMenuItem>{t('item', { number: 5 })}</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </MenuButton>
          <Button variant="outline" className="max-md:hidden">
            {t('button', { number: 3 })}
          </Button>
          <MenuButton label={t('split_menu')} variant="secondary" align="end" split>
            {menuItems}
          </MenuButton>
        </ButtonGroup>
      </DemoCard>

      <DemoCard title={t('vertical_title')}>
        <ButtonGroup label={t('vertical_label')} orientation="vertical">
          <Button variant="outline">{t('top')}</Button>
          <Button variant="outline">{t('middle')}</Button>
          <Button variant="outline">{t('bottom')}</Button>
        </ButtonGroup>
      </DemoCard>

      <DemoCard
        title={t('toolbar_title')}
        description={t('toolbar_description')}
        contentClassName="flex flex-col gap-5"
      >
        <div role="toolbar" aria-label={t('toolbar_pages_label')} className="flex flex-wrap gap-2">
          <ButtonGroup label={t('back_label')}>
            <Button variant="outline" size="icon" aria-label={t('first')} className="max-md:hidden">
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('previous')}
              className="max-md:rounded-l-md!"
            >
              <ChevronLeftIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup label={t('edit_label')}>
            <Button variant="outline" className="max-md:hidden">
              {t('edit')}
            </Button>
            <Button variant="outline" className="max-md:rounded-l-md!">
              {t('undo')}
            </Button>
            <Button variant="outline">{t('redo')}</Button>
          </ButtonGroup>
          <ButtonGroup label={t('forward_label')}>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('next')}
              className="max-md:rounded-r-md!"
            >
              <ChevronRightIcon />
            </Button>
            <Button variant="outline" size="icon" aria-label={t('last')} className="max-md:hidden">
              <ChevronsRightIcon />
            </Button>
          </ButtonGroup>
        </div>

        <Separator className="max-md:hidden" />

        <div
          role="toolbar"
          aria-label={t('toolbar_inputs_label')}
          className="flex flex-wrap items-center gap-2 max-md:hidden"
        >
          <ButtonGroup label={t('create_label')}>
            <Button variant="outline" size="sm">
              {t('new')}
            </Button>
            <Button variant="outline" size="sm">
              {t('edit')}
            </Button>
          </ButtonGroup>
          <InputGroup className="w-36 bg-ply">
            <InputGroupAddon>$</InputGroupAddon>
            <InputGroupInput defaultValue="100" inputMode="decimal" aria-label={t('amount')} />
            <InputGroupAddon align="inline-end">.00</InputGroupAddon>
          </InputGroup>
          <div className="flex items-center gap-2">
            <Label htmlFor="toolbar-size">{t('size')}</Label>
            <NativeSelect id="toolbar-size" size="sm" defaultValue="medium" className="w-32">
              {TOOLBAR_SIZES.map((size) => (
                <NativeSelectOption key={size} value={size}>
                  {t(`toolbar_size_${size}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <ButtonGroup label={t('save_label')}>
            <Button variant="outline" size="sm">
              {t('save')}
            </Button>
            <Button variant="outline" size="sm">
              {t('cancel')}
            </Button>
          </ButtonGroup>
        </div>

        <Separator />

        <div role="toolbar" aria-label={t('toolbar_menu_label')} className="flex flex-wrap gap-2">
          <ButtonGroup label={t('create_label')} className="max-md:hidden">
            <Button variant="outline">{t('new')}</Button>
            <Button variant="outline">{t('edit')}</Button>
            <Button variant="outline">{t('undo')}</Button>
          </ButtonGroup>
          <MenuButton label={t('menu')} align="end">
            <DropdownMenuItem>{t('item', { number: 1 })}</DropdownMenuItem>
            <DropdownMenuItem>{t('item', { number: 2 })}</DropdownMenuItem>
            <DropdownMenuItem>{t('item', { number: 3 })}</DropdownMenuItem>
          </MenuButton>
          <ButtonGroup label={t('save_label')}>
            <Button variant="outline">{t('save')}</Button>
            <Button variant="outline">{t('cancel')}</Button>
          </ButtonGroup>
        </div>
      </DemoCard>

      <DemoCard
        title={t('toggle_title')}
        description={t('toggle_description')}
        contentClassName="flex flex-wrap items-center gap-6"
      >
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          defaultValue="left"
          aria-label={t('alignment_label')}
        >
          <ToggleGroupItem value="left" aria-label={t('align_left')}>
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label={t('align_center')}>
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label={t('align_right')}>
            <AlignRightIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label={t('align_justify')}>
            <AlignJustifyIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          defaultValue={['bold']}
          aria-label={t('formatting_label')}
        >
          <ToggleGroupItem value="bold" aria-label={t('bold')}>
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label={t('italic')}>
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label={t('underline')}>
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </DemoCard>
    </>
  );
}
