import {
  BanIcon,
  CircleCheckIcon,
  EuroIcon,
  LockKeyholeIcon,
  MailIcon,
  MailOpenIcon,
  PencilIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { describedBy, FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { ActionMenu } from '@/components/showcase/forms/ActionMenu';
import { BrandGlyph } from '@/components/showcase/forms/BrandGlyph';
import { ClosableCard } from '@/components/showcase/forms/ClosableCard';
import { CustomFileInput } from '@/components/showcase/forms/CustomFileInput';
import {
  CARD_MONTHS,
  CARD_YEARS,
  GRID_SPANS,
  OPTION_NUMBERS,
  SPLIT_SPANS,
} from '@/components/showcase/forms/data';
import { DemoForm } from '@/components/showcase/forms/DemoForm';
import { FieldGroup } from '@/components/showcase/forms/FieldGroup';
import { FormActions } from '@/components/showcase/forms/FormActions';
import { HorizontalField } from '@/components/showcase/forms/HorizontalField';
import { ValidatedInput } from '@/components/showcase/forms/ValidatedInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Tailwind only sees literal class names, so every span the grids use is spelled out.
const SPAN: Record<number, string> = {
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};
const SM_SPAN: Record<number, string> = {
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12',
};
const MD_SPAN: Record<number, string> = {
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
};

// The four check and radio groups of the Vue page: stacked or inline, native or custom.
const CHOICE_GROUPS = [
  { key: 'stacked', inline: false, custom: false },
  { key: 'inline', inline: true, custom: false },
  { key: 'custom', inline: false, custom: true },
  { key: 'inline_custom', inline: true, custom: true },
] as const;

const optionLabelClass = 'text-[0.9375rem] text-ink-900';

export default async function BasicFormsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'BasicFormsPage' });

  const submitReset = (
    <FormActions>
      <Button type="submit" size="sm">
        <CircleCheckIcon aria-hidden="true" data-icon="inline-start" />
        {t('submit')}
      </Button>
      <Button type="reset" size="sm" variant="destructive">
        <BanIcon aria-hidden="true" data-icon="inline-start" />
        {t('reset')}
      </Button>
    </FormActions>
  );

  const variantActions = (
    <FormActions>
      <Button type="button" size="sm">
        {t('action')}
      </Button>
      <Button type="button" size="sm" variant="destructive">
        {t('action')}
      </Button>
      <Button type="button" size="sm" variant="outline">
        {t('action')}
      </Button>
      <Button type="button" size="sm" variant="secondary">
        {t('action')}
      </Button>
      <Button type="button" size="sm" variant="ghost">
        {t('action')}
      </Button>
    </FormActions>
  );

  const selectOptions = OPTION_NUMBERS.map((number) => (
    <NativeSelectOption key={number} value={`option-${number}`}>
      {t('option', { number })}
    </NativeSelectOption>
  ));
  const placeholderOption = (
    <NativeSelectOption value="" disabled>
      {t('select_placeholder')}
    </NativeSelectOption>
  );

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <DemoCard title={t('credit_card_title')} description={t('credit_card_description')}>
          <DemoForm className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FormField htmlFor="cc-name" label={t('name_label')} className="sm:col-span-3">
              <Input id="cc-name" placeholder={t('name_placeholder')} autoComplete="cc-name" />
            </FormField>
            <FormField htmlFor="cc-number" label={t('card_number_label')} className="sm:col-span-3">
              <Input
                id="cc-number"
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
                className="tabular-nums"
              />
            </FormField>
            <FormField htmlFor="cc-month" label={t('month_label')}>
              <NativeSelect id="cc-month" defaultValue="1" autoComplete="cc-exp-month">
                {CARD_MONTHS.map((month) => (
                  <NativeSelectOption key={month} value={month}>
                    {month}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            <FormField htmlFor="cc-year" label={t('year_label')}>
              <NativeSelect id="cc-year" defaultValue={CARD_YEARS[0]} autoComplete="cc-exp-year">
                {CARD_YEARS.map((year) => (
                  <NativeSelectOption key={year} value={year}>
                    {year}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            <FormField htmlFor="cc-cvv" label={t('cvv_label')}>
              <Input
                id="cc-cvv"
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                className="tabular-nums"
              />
            </FormField>
          </DemoForm>
        </DemoCard>

        <DemoCard title={t('company_title')} description={t('company_description')}>
          <DemoForm className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FormField htmlFor="company-name" label={t('company_label')} className="sm:col-span-3">
              <Input
                id="company-name"
                placeholder={t('company_placeholder')}
                autoComplete="organization"
              />
            </FormField>
            <FormField htmlFor="company-vat" label={t('vat_label')} className="sm:col-span-3">
              <Input id="company-vat" placeholder="PL1234567890" />
            </FormField>
            <FormField htmlFor="company-street" label={t('street_label')} className="sm:col-span-3">
              <Input
                id="company-street"
                placeholder={t('street_placeholder')}
                autoComplete="address-line1"
              />
            </FormField>
            <FormField htmlFor="company-city" label={t('city_label')} className="sm:col-span-2">
              <Input
                id="company-city"
                placeholder={t('city_placeholder')}
                autoComplete="address-level2"
              />
            </FormField>
            <FormField htmlFor="company-postal" label={t('postal_code_label')}>
              <Input
                id="company-postal"
                placeholder={t('postal_code_placeholder')}
                autoComplete="postal-code"
              />
            </FormField>
            <FormField
              htmlFor="company-country"
              label={t('country_label')}
              className="sm:col-span-3"
            >
              <Input
                id="company-country"
                placeholder={t('country_placeholder')}
                autoComplete="country-name"
              />
            </FormField>
          </DemoForm>
        </DemoCard>

        <div className="flex flex-col gap-8">
          <DemoCard title={t('elements_title')} description={t('elements_description')}>
            <DemoForm className="flex flex-col gap-5">
              <HorizontalField
                htmlFor="el-name"
                label={t('full_name_label')}
                hint={t('full_name_hint')}
              >
                <Input id="el-name" autoComplete="name" aria-describedby={describedBy('el-name')} />
              </HorizontalField>
              <HorizontalField htmlFor="el-static" label={t('static_label')}>
                <Input
                  id="el-static"
                  readOnly
                  defaultValue={t('static_value')}
                  className="border-transparent bg-transparent px-0 shadow-none hover:border-transparent focus-visible:ring-0"
                />
              </HorizontalField>
              <HorizontalField htmlFor="el-text" label={t('text_label')} hint={t('text_hint')}>
                <Input
                  id="el-text"
                  placeholder={t('text_placeholder')}
                  aria-describedby={describedBy('el-text')}
                />
              </HorizontalField>
              <HorizontalField htmlFor="el-date" label={t('date_label')}>
                <Input id="el-date" type="date" className="tabular-nums" />
              </HorizontalField>
              <HorizontalField
                htmlFor="el-email"
                label={t('email_input_label')}
                hint={t('email_input_hint')}
              >
                <Input
                  id="el-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('email_input_placeholder')}
                  aria-describedby={describedBy('el-email')}
                />
              </HorizontalField>
              <HorizontalField
                htmlFor="el-password"
                label={t('password_input_label')}
                hint={t('password_input_hint')}
              >
                <Input
                  id="el-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('password_input_placeholder')}
                  aria-describedby={describedBy('el-password')}
                />
              </HorizontalField>
              <HorizontalField htmlFor="el-disabled" label={t('disabled_label')}>
                <Input id="el-disabled" placeholder={t('disabled_placeholder')} disabled />
              </HorizontalField>
              <HorizontalField htmlFor="el-textarea" label={t('textarea_label')}>
                <Textarea
                  id="el-textarea"
                  rows={9}
                  placeholder={t('textarea_placeholder')}
                  className="min-h-48"
                />
              </HorizontalField>
              <HorizontalField htmlFor="el-select" label={t('select_label')}>
                <NativeSelect id="el-select" defaultValue="">
                  {placeholderOption}
                  {selectOptions}
                </NativeSelect>
              </HorizontalField>
              <HorizontalField htmlFor="el-select-lg" label={t('large_select_label')}>
                <NativeSelect
                  id="el-select-lg"
                  defaultValue="selected"
                  className="[&>select]:h-11 [&>select]:text-base"
                >
                  {placeholderOption}
                  {selectOptions}
                  <NativeSelectOption value="selected">{t('selected_option')}</NativeSelectOption>
                </NativeSelect>
              </HorizontalField>
              <HorizontalField htmlFor="el-select-sm" label={t('small_select_label')}>
                <Select name="el-select-sm">
                  <SelectTrigger
                    id="el-select-sm"
                    size="sm"
                    className="w-full rounded-md border-ink-300 bg-ply text-ink-900 shadow-ply hover:border-ink-400 focus-visible:border-folder focus-visible:ring-folder/20"
                  >
                    <SelectValue placeholder={t('select_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_NUMBERS.map((number) => (
                      <SelectItem key={number} value={`option-${number}`}>
                        {t('option', { number })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </HorizontalField>
              <HorizontalField htmlFor="el-select-disabled" label={t('disabled_select_label')}>
                <NativeSelect id="el-select-disabled" defaultValue="" disabled>
                  {placeholderOption}
                  {selectOptions}
                </NativeSelect>
              </HorizontalField>

              {CHOICE_GROUPS.map((group, groupIndex) => (
                <HorizontalField
                  key={`checkbox-${group.key}`}
                  labelId={`checkbox-${group.key}-label`}
                  label={t(`checkboxes_${group.key}`)}
                >
                  <fieldset
                    aria-labelledby={`checkbox-${group.key}-label`}
                    className={
                      group.inline ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex flex-col gap-2.5'
                    }
                  >
                    {OPTION_NUMBERS.map((number, optionIndex) => {
                      const id = `checkbox-${group.key}-${number}`;
                      const checked = optionIndex === groupIndex;
                      return (
                        <div key={number} className="flex items-center gap-2">
                          {group.custom ? (
                            <Checkbox id={id} name={id} defaultChecked={checked} />
                          ) : (
                            <input
                              id={id}
                              name={id}
                              type="checkbox"
                              defaultChecked={checked}
                              className="size-4 accent-folder"
                            />
                          )}
                          <label htmlFor={id} className={optionLabelClass}>
                            {t('option', { number })}
                          </label>
                        </div>
                      );
                    })}
                  </fieldset>
                </HorizontalField>
              ))}

              {CHOICE_GROUPS.map((group, groupIndex) => {
                const labelId = `radio-${group.key}-label`;
                // As on the Vue page, group N starts with option N checked (the first starts empty).
                const checked = groupIndex === 0 ? undefined : `option-${groupIndex}`;
                return (
                  <HorizontalField
                    key={`radio-${group.key}`}
                    labelId={labelId}
                    label={t(`radios_${group.key}`)}
                  >
                    {group.custom ? (
                      <RadioGroup
                        aria-labelledby={labelId}
                        name={`radio-${group.key}`}
                        defaultValue={checked}
                        className={
                          group.inline ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex flex-col gap-2.5'
                        }
                      >
                        {OPTION_NUMBERS.map((number) => (
                          <div key={number} className="flex items-center gap-2">
                            <RadioGroupItem
                              id={`radio-${group.key}-${number}`}
                              value={`option-${number}`}
                            />
                            <label
                              htmlFor={`radio-${group.key}-${number}`}
                              className={optionLabelClass}
                            >
                              {t('option', { number })}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div
                        role="radiogroup"
                        aria-labelledby={labelId}
                        className={
                          group.inline ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex flex-col gap-2.5'
                        }
                      >
                        {OPTION_NUMBERS.map((number) => (
                          <div key={number} className="flex items-center gap-2">
                            <input
                              id={`radio-${group.key}-${number}`}
                              type="radio"
                              name={`radio-${group.key}`}
                              value={`option-${number}`}
                              defaultChecked={checked === `option-${number}`}
                              className="size-4 accent-folder"
                            />
                            <label
                              htmlFor={`radio-${group.key}-${number}`}
                              className={optionLabelClass}
                            >
                              {t('option', { number })}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </HorizontalField>
                );
              })}

              <HorizontalField htmlFor="el-file" label={t('file_label')}>
                <Input id="el-file" type="file" className="h-auto py-1.5" />
              </HorizontalField>
              <HorizontalField htmlFor="el-files" label={t('multiple_file_label')}>
                <Input id="el-files" type="file" multiple className="h-auto py-1.5" />
              </HorizontalField>
              <HorizontalField htmlFor="el-custom-file" label={t('custom_file_label')}>
                <CustomFileInput id="el-custom-file" />
              </HorizontalField>
              <HorizontalField htmlFor="el-custom-files" label={t('multiple_custom_file_label')}>
                <CustomFileInput id="el-custom-files" multiple />
              </HorizontalField>
              {submitReset}
            </DemoForm>
          </DemoCard>

          <DemoCard title={t('inline_title')} description={t('inline_description')}>
            <DemoForm className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="inline-name">{t('inline_name_label')}</Label>
                  <Input
                    id="inline-name"
                    placeholder={t('inline_name_placeholder')}
                    autoComplete="name"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="inline-email">{t('inline_email_label')}</Label>
                  <Input
                    id="inline-email"
                    type="email"
                    placeholder={t('inline_email_placeholder')}
                    autoComplete="email"
                  />
                </div>
              </div>
              {submitReset}
            </DemoForm>
          </DemoCard>
        </div>

        <div className="flex flex-col gap-8">
          <DemoCard title={t('horizontal_title')} description={t('horizontal_description')}>
            <DemoForm className="flex flex-col gap-5">
              <HorizontalField htmlFor="hz-email" label={t('email_label')} hint={t('email_hint')}>
                <Input
                  id="hz-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('email_placeholder')}
                  aria-describedby={describedBy('hz-email')}
                />
              </HorizontalField>
              <HorizontalField
                htmlFor="hz-password"
                label={t('password_label')}
                hint={t('password_hint')}
              >
                <Input
                  id="hz-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('password_placeholder')}
                  aria-describedby={describedBy('hz-password')}
                />
              </HorizontalField>
              {submitReset}
            </DemoForm>
          </DemoCard>

          <DemoCard title={t('normal_title')} description={t('normal_description')}>
            <DemoForm className="flex flex-col gap-5">
              <ValidatedInput
                id="normal-email"
                type="email"
                rule="email"
                label={t('email_label')}
                hint={t('email_hint')}
                placeholder={t('email_placeholder')}
                autoComplete="email"
              />
              <ValidatedInput
                id="normal-password"
                type="password"
                rule="required"
                label={t('password_label')}
                hint={t('password_hint')}
                placeholder={t('password_placeholder')}
                autoComplete="current-password"
              />
              {submitReset}
            </DemoForm>
          </DemoCard>

          <DemoCard title={t('input_grid_title')} description={t('input_grid_description')}>
            <DemoForm className="flex flex-col gap-3">
              {GRID_SPANS.map((span) => (
                <div key={span} className="grid grid-cols-12">
                  <Input
                    aria-label={t('grid_placeholder', { span })}
                    placeholder={t('grid_placeholder', { span })}
                    className={`col-span-12 ${SM_SPAN[span]}`}
                  />
                </div>
              ))}
              <FormActions className="mt-2">
                <Button type="submit" size="sm">
                  <UserIcon aria-hidden="true" data-icon="inline-start" />
                  {t('login')}
                </Button>
                <Button type="reset" size="sm" variant="destructive">
                  <BanIcon aria-hidden="true" data-icon="inline-start" />
                  {t('reset')}
                </Button>
              </FormActions>
            </DemoForm>
          </DemoCard>

          <DemoCard title={t('sizes_title')} description={t('sizes_description')}>
            <DemoForm className="flex flex-col gap-5">
              <HorizontalField htmlFor="size-sm" label={t('small_input_label')}>
                <Input
                  id="size-sm"
                  placeholder={t('small_input_placeholder')}
                  className="h-8 px-2.5 text-sm sm:text-sm"
                />
              </HorizontalField>
              <HorizontalField htmlFor="size-default" label={t('default_input_label')}>
                <Input id="size-default" placeholder={t('default_input_placeholder')} />
              </HorizontalField>
              <HorizontalField htmlFor="size-lg" label={t('large_input_label')}>
                <Input
                  id="size-lg"
                  placeholder={t('large_input_placeholder')}
                  className="h-12 px-4 text-lg sm:text-lg"
                />
              </HorizontalField>
              {submitReset}
            </DemoForm>
          </DemoCard>
        </div>

        <DemoCard
          title={t('basic_validation_title')}
          description={t('basic_validation_description')}
        >
          <form className="flex flex-col gap-5" noValidate>
            <ValidatedInput
              id="basic-valid"
              rule="optional"
              label={t('valid_input_label')}
              validFeedback={t('not_required_feedback')}
            />
            <ValidatedInput
              id="basic-invalid"
              rule="required"
              label={t('invalid_input_label')}
              validFeedback={t('thank_you_feedback')}
              invalidFeedback={t('required_feedback')}
            />
          </form>
        </DemoCard>

        <DemoCard
          title={t('custom_validation_title')}
          description={t('custom_validation_description')}
        >
          <form className="flex flex-col gap-5" noValidate>
            <ValidatedInput
              id="custom-valid"
              rule="min_length_4"
              label={t('valid_input_label')}
              defaultValue={t('valid_value')}
              validFeedback={t('valid_feedback')}
              invalidFeedback={t('min_length_feedback')}
            />
            <ValidatedInput
              id="custom-invalid"
              rule="min_length_4"
              label={t('invalid_input_label')}
              validFeedback={t('thank_you_feedback')}
              invalidFeedback={t('min_length_feedback')}
            />
          </form>
        </DemoCard>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <DemoCard title={t('icon_groups_title')} description={t('icon_groups_description')}>
          <DemoForm className="flex flex-col gap-4">
            <FieldGroup>
              <InputGroupInput aria-label={t('username')} placeholder={t('username')} />
              <InputGroupAddon>
                <UserIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="email"
                autoComplete="email"
                aria-label={t('email')}
                placeholder={t('email')}
              />
              <InputGroupAddon align="inline-end">
                <MailOpenIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                inputMode="decimal"
                aria-label={t('amount')}
                placeholder={t('amount_placeholder')}
                className="tabular-nums"
              />
              <InputGroupAddon>
                <EuroIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupText>.00</InputGroupText>
              </InputGroupAddon>
            </FieldGroup>
            {submitReset}
          </DemoForm>
        </DemoCard>

        <DemoCard title={t('button_groups_title')} description={t('button_groups_description')}>
          <DemoForm className="flex flex-col gap-4">
            <FieldGroup>
              <InputGroupInput aria-label={t('username')} placeholder={t('username')} />
              <InputGroupAddon>
                <InputGroupButton variant="default" size="sm">
                  <SearchIcon aria-hidden="true" />
                  {t('search')}
                </InputGroupButton>
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="email"
                autoComplete="email"
                aria-label={t('email')}
                placeholder={t('email')}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit" variant="default" size="sm">
                  {t('submit')}
                </InputGroupButton>
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="email"
                autoComplete="email"
                aria-label={t('email')}
                placeholder={t('email')}
              />
              <InputGroupAddon>
                <InputGroupButton variant="default" size="icon-sm" aria-label={t('facebook')}>
                  <BrandGlyph brand="facebook" />
                </InputGroupButton>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="default" size="icon-sm" aria-label={t('twitter')}>
                  <BrandGlyph brand="twitter" />
                </InputGroupButton>
              </InputGroupAddon>
            </FieldGroup>
            {submitReset}
          </DemoForm>
        </DemoCard>

        <DemoCard title={t('dropdown_groups_title')} description={t('dropdown_groups_description')}>
          <DemoForm className="flex flex-col gap-4">
            <FieldGroup>
              <InputGroupInput aria-label={t('username')} placeholder={t('username')} />
              <InputGroupAddon>
                <ActionMenu />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="email"
                autoComplete="email"
                aria-label={t('email')}
                placeholder={t('email')}
              />
              <InputGroupAddon align="inline-end">
                <ActionMenu align="end" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput aria-label={t('notes')} placeholder="…" />
              <InputGroupAddon>
                <ActionMenu split />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <ActionMenu align="end" />
              </InputGroupAddon>
            </FieldGroup>
            {submitReset}
          </DemoForm>
        </DemoCard>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <DemoCard title={t('grid_large_title')} description={t('grid_large_description')}>
          <DemoForm className="flex flex-col gap-3">
            {SPLIT_SPANS.map((span) => (
              <div key={span} className="grid grid-cols-12 gap-3">
                <Input
                  aria-label={t('grid_placeholder', { span: 12 - span })}
                  placeholder={t('grid_placeholder', { span: 12 - span })}
                  className={`col-span-12 ${MD_SPAN[12 - span]}`}
                />
                <Input
                  aria-label={t('grid_placeholder', { span })}
                  placeholder={t('grid_placeholder', { span })}
                  className={`col-span-12 ${MD_SPAN[span]}`}
                />
              </div>
            ))}
            {variantActions}
          </DemoForm>
        </DemoCard>

        <DemoCard title={t('grid_small_title')} description={t('grid_small_description')}>
          <DemoForm className="flex flex-col gap-3">
            {SPLIT_SPANS.map((span) => (
              <div key={span} className="grid grid-cols-12 gap-3">
                <Input
                  aria-label={t('grid_placeholder', { span })}
                  placeholder={t('grid_placeholder', { span })}
                  className={SPAN[span]}
                />
                <Input
                  aria-label={t('grid_placeholder', { span: 12 - span })}
                  placeholder={t('grid_placeholder', { span: 12 - span })}
                  className={SPAN[12 - span]}
                />
              </div>
            ))}
            {variantActions}
          </DemoForm>
        </DemoCard>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <DemoCard title={t('example_title')} description={t('example_text_description')}>
          <DemoForm className="flex flex-col gap-4">
            <FieldGroup>
              <InputGroupAddon>
                <InputGroupText className="font-semibold text-ink-700">
                  {t('username')}
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput aria-label={t('username')} autoComplete="username" />
              <InputGroupAddon align="inline-end">
                <UserIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupAddon>
                <InputGroupText className="font-semibold text-ink-700">{t('email')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput type="email" aria-label={t('email')} autoComplete="email" />
              <InputGroupAddon align="inline-end">
                <MailIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupAddon>
                <InputGroupText className="font-semibold text-ink-700">
                  {t('password')}
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="password"
                aria-label={t('password')}
                autoComplete="current-password"
              />
              <InputGroupAddon align="inline-end">
                <LockKeyholeIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <div>
              <Button type="submit" size="sm">
                {t('submit')}
              </Button>
            </div>
          </DemoForm>
        </DemoCard>

        <DemoCard title={t('example_title')} description={t('example_append_description')}>
          <DemoForm className="flex flex-col gap-4">
            <FieldGroup>
              <InputGroupInput
                aria-label={t('username')}
                placeholder={t('username')}
                autoComplete="username"
              />
              <InputGroupAddon align="inline-end">
                <UserIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="email"
                aria-label={t('email')}
                placeholder={t('email')}
                autoComplete="email"
              />
              <InputGroupAddon align="inline-end">
                <MailIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="password"
                aria-label={t('password')}
                placeholder={t('password')}
                autoComplete="current-password"
              />
              <InputGroupAddon align="inline-end">
                <LockKeyholeIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <div>
              <Button type="submit" size="sm" variant="secondary">
                {t('submit')}
              </Button>
            </div>
          </DemoForm>
        </DemoCard>

        <DemoCard title={t('example_title')} description={t('example_prepend_description')}>
          <DemoForm className="flex flex-col gap-4">
            <FieldGroup>
              <InputGroupInput
                aria-label={t('username')}
                placeholder={t('username')}
                autoComplete="username"
              />
              <InputGroupAddon>
                <UserIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="email"
                aria-label={t('email')}
                placeholder={t('email')}
                autoComplete="email"
              />
              <InputGroupAddon>
                <MailIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <FieldGroup>
              <InputGroupInput
                type="password"
                aria-label={t('password')}
                placeholder={t('password')}
                autoComplete="current-password"
              />
              <InputGroupAddon>
                <LockKeyholeIcon aria-hidden="true" />
              </InputGroupAddon>
            </FieldGroup>
            <div>
              <Button type="submit" size="sm" variant="outline">
                {t('submit')}
              </Button>
            </div>
          </DemoForm>
        </DemoCard>
      </div>

      <ClosableCard
        title={t('form_elements_title')}
        icon={<PencilIcon aria-hidden="true" className="size-4 text-ink-600" />}
      >
        <DemoForm className="flex flex-col gap-5">
          <FormField htmlFor="fe-prepend" label={t('prepended_label')} hint={t('help_text')}>
            <FieldGroup>
              <InputGroupAddon>
                <InputGroupText>@</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="fe-prepend"
                type="email"
                autoComplete="email"
                aria-describedby={describedBy('fe-prepend')}
              />
            </FieldGroup>
          </FormField>
          <FormField htmlFor="fe-append" label={t('appended_label')} hint={t('help_text')}>
            <FieldGroup>
              <InputGroupInput
                id="fe-append"
                inputMode="decimal"
                className="tabular-nums"
                aria-describedby={describedBy('fe-append')}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>.00</InputGroupText>
              </InputGroupAddon>
            </FieldGroup>
          </FormField>
          <FormField htmlFor="fe-both" label={t('appended_prepended_label')} hint={t('help_text')}>
            <FieldGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="fe-both"
                inputMode="decimal"
                className="tabular-nums"
                aria-describedby={describedBy('fe-both')}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>.00</InputGroupText>
              </InputGroupAddon>
            </FieldGroup>
          </FormField>
          <FormField htmlFor="fe-button" label={t('append_button_label')} hint={t('help_text')}>
            <FieldGroup>
              <InputGroupInput id="fe-button" aria-describedby={describedBy('fe-button')} />
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="default" size="sm">
                  {t('go')}
                </InputGroupButton>
              </InputGroupAddon>
            </FieldGroup>
          </FormField>
          <FormField htmlFor="fe-two-buttons" label={t('two_buttons_label')}>
            <FieldGroup>
              <InputGroupInput id="fe-two-buttons" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="default" size="sm">
                  {t('search')}
                </InputGroupButton>
                <InputGroupButton variant="destructive" size="sm">
                  {t('options')}
                </InputGroupButton>
              </InputGroupAddon>
            </FieldGroup>
          </FormField>
          <FormActions>
            <Button type="submit">{t('save_changes')}</Button>
            <Button type="reset" variant="outline">
              {t('cancel')}
            </Button>
          </FormActions>
        </DemoForm>
      </ClosableCard>
    </>
  );
}
