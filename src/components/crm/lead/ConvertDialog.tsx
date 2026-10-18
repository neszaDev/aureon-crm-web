'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeftIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { convertLead } from '@/actions/crm/LeadActions';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { RecordPicker } from '@/components/crm/fields/RecordPicker';
import { ConversionSummary } from '@/components/crm/lead/ConversionSummary';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { fullName } from '@/libs/crm/Format';
import { useRouter } from '@/libs/I18nNavigation';
import type { ConversionValues, ConvertFormValues } from '@/validations/crm/LeadValidation';
import { ConvertFormValidation } from '@/validations/crm/LeadValidation';

type Lead = components['schemas']['LeadResponse'];
type Conversion = components['schemas']['LeadConversionResponse'];

type ConvertProps = {
  workspaceId: number;
  lead: Lead;
  stages: components['schemas']['StageResponse'][];
  defaultCurrency: string;
  currencies: { value: string; label: string }[];
  timeZone: string;
};

// The backend's field names for what a conversion refuses (`deal.<field>` for the deal), by the
// form's own.
const FIELDS: Record<string, keyof ConvertFormValues> = {
  companyId: 'companyLink',
  contactId: 'contactLink',
  'deal.name': 'dealName',
  'deal.amount': 'dealAmount',
  'deal.currency': 'dealCurrency',
  'deal.stageId': 'dealStageId',
  'deal.expectedCloseDate': 'dealCloseDate',
};

/**
 * The form's starting values: the lead's company (when it has a name) and a contact made from
 * the lead, and a deal named after the company or the person, of the lead's value and currency
 * (the workspace's without one), in the first open stage.
 * @param props The dialog's props.
 * @param dealName The default deal name for a company or person's name, in the page's language.
 * @returns The values.
 */
const startingValues = (
  props: ConvertProps,
  dealName: (name: string) => string,
): ConvertFormValues => ({
  company: props.lead.companyName ? 'create' : 'none',
  companyLink: null,
  contact: 'create',
  contactLink: null,
  deal: true,
  dealName: dealName(props.lead.companyName ?? fullName(props.lead)),
  dealAmount: props.lead.estimatedValue ?? '',
  dealCurrency: props.lead.currency ?? props.defaultCurrency,
  dealStageId: props.stages[0]?.id ?? null,
  dealCloseDate: '',
});

/**
 * What the action sends for the form's choices.
 * @param values The form's values.
 * @returns The conversion.
 */
const toConversion = (values: ConvertFormValues): ConversionValues => ({
  companyId: values.company === 'link' ? (values.companyLink?.id ?? null) : null,
  createCompany: values.company === 'create',
  contactId: values.contact === 'link' ? (values.contactLink?.id ?? null) : null,
  deal: values.deal
    ? {
        name: values.dealName,
        amount: values.dealAmount,
        currency: values.dealCurrency,
        stageId: values.dealStageId,
        expectedCloseDate: values.dealCloseDate || null,
      }
    : null,
});

/**
 * A picked record's own error, which react-hook-form types as an object's.
 * @param error The error of the picker's field.
 * @returns The error for its form field.
 */
const pickedError = (error?: { message?: string }) =>
  error?.message === undefined ? undefined : { type: 'validate', message: error.message };

/**
 * One radio of a group, with its label.
 * @param props Component props.
 * @param props.id The radio's id.
 * @param props.value Its value.
 * @param props.label Its label.
 * @returns The radio and its label.
 */
const Choice = (props: { id: string; value: string; label: string }) => (
  <div className="flex min-h-9 items-center gap-3">
    <RadioGroupItem id={props.id} value={props.value} />
    <Label htmlFor={props.id} className="text-[0.9375rem] font-normal text-foreground">
      {props.label}
    </Label>
  </div>
);

/**
 * The conversion's choices, mounted each time the dialog opens, so it starts from the lead.
 * Submitting twice before the first answer is one conversion: the button is disabled while it
 * is on its way, and a second submit that gets past that is dropped.
 * @param props The dialog's props.
 * @param props.onDone Called with the result, which the dialog then shows.
 * @returns The form.
 */
const ConvertForm = (props: ConvertProps & { onDone: (conversion: Conversion) => void }) => {
  const t = useTranslations('ConvertDialog');
  const [failure, setFailure] = useState<ActionResult>();
  const inFlight = useRef(false);
  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(ConvertFormValidation),
    defaultValues: startingValues(props, (name) => t('deal_name_default', { name })),
  });
  const { errors, isSubmitting } = form.formState;
  const company = useWatch({ control: form.control, name: 'company' });
  const contact = useWatch({ control: form.control, name: 'contact' });
  const withDeal = useWatch({ control: form.control, name: 'deal' });
  const { lead } = props;

  const convert = form.handleSubmit(async (values) => {
    setFailure(undefined);
    try {
      const result = await convertLead(props.workspaceId, lead.id, toConversion(values));
      if (result.conversion) {
        props.onDone(result.conversion);
        return;
      }
      for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
        const field = FIELDS[name];
        if (field) {
          form.setError(field, { type: 'server', message });
        }
      }
      setFailure(result);
    } catch {
      // Nothing came back (the network): converting again is safe, a repeat gives the first result.
      setFailure({ ok: false, message: t('error_generic') });
    }
  });

  return (
    <form
      method="post"
      onSubmit={async (event) => {
        // A second submit before the first has answered is the same conversion: dropped.
        if (inFlight.current) {
          event.preventDefault();
          return;
        }
        inFlight.current = true;
        try {
          await convert(event);
        } finally {
          inFlight.current = false;
        }
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>{t('title', { name: fullName(lead) })}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <ActionAlert result={failure} />

      <fieldset className="flex flex-col gap-1">
        <legend id="convert-company-legend" className="mb-1 text-sm font-semibold">
          {t('company_legend')}
        </legend>
        <Controller
          control={form.control}
          name="company"
          render={(controller) => (
            <RadioGroup
              aria-labelledby="convert-company-legend"
              value={controller.field.value}
              onValueChange={(next) => {
                controller.field.onChange(next);
              }}
              className="gap-0"
            >
              {lead.companyName && (
                <Choice
                  id="convert-company-create"
                  value="create"
                  label={t('company_create', { name: lead.companyName })}
                />
              )}
              <Choice id="convert-company-link" value="link" label={t('company_link')} />
              <Choice id="convert-company-none" value="none" label={t('company_none')} />
            </RadioGroup>
          )}
        />
        {company === 'link' && (
          <FormField
            htmlFor="convert-company"
            label={t('company_label')}
            error={pickedError(errors.companyLink)}
            className="mt-2"
          >
            <Controller
              control={form.control}
              name="companyLink"
              render={(controller) => (
                <RecordPicker
                  id="convert-company"
                  workspaceId={props.workspaceId}
                  kind="company"
                  value={controller.field.value}
                  initialQuery={lead.companyName}
                  invalid={Boolean(errors.companyLink)}
                  describedBy={errors.companyLink ? describedBy('convert-company') : undefined}
                  onChange={(next) => {
                    controller.field.onChange(next);
                  }}
                />
              )}
            />
          </FormField>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend id="convert-contact-legend" className="mb-1 text-sm font-semibold">
          {t('contact_legend')}
        </legend>
        <Controller
          control={form.control}
          name="contact"
          render={(controller) => (
            <RadioGroup
              aria-labelledby="convert-contact-legend"
              value={controller.field.value}
              onValueChange={(next) => {
                controller.field.onChange(next);
              }}
              className="gap-0"
            >
              <Choice id="convert-contact-create" value="create" label={t('contact_create')} />
              <Choice id="convert-contact-link" value="link" label={t('contact_link')} />
            </RadioGroup>
          )}
        />
        {contact === 'link' && (
          <FormField
            htmlFor="convert-contact"
            label={t('contact_label')}
            error={pickedError(errors.contactLink)}
            className="mt-2"
          >
            <Controller
              control={form.control}
              name="contactLink"
              render={(controller) => (
                <RecordPicker
                  id="convert-contact"
                  workspaceId={props.workspaceId}
                  kind="contact"
                  value={controller.field.value}
                  initialQuery={lead.email}
                  invalid={Boolean(errors.contactLink)}
                  describedBy={errors.contactLink ? describedBy('convert-contact') : undefined}
                  onChange={(next) => {
                    controller.field.onChange(next);
                  }}
                />
              )}
            />
          </FormField>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">{t('deal_legend')}</legend>
        <div className="flex min-h-9 items-center gap-3">
          <Controller
            control={form.control}
            name="deal"
            render={(controller) => (
              <Switch
                id="convert-deal"
                checked={controller.field.value}
                onCheckedChange={(next) => {
                  controller.field.onChange(next);
                }}
              />
            )}
          />
          <Label htmlFor="convert-deal" className="text-sm font-semibold text-foreground">
            {t('deal_switch')}
          </Label>
        </div>
        {withDeal && (
          <>
            <FormField
              htmlFor="convert-deal-name"
              label={t('deal_name_label')}
              error={errors.dealName}
            >
              <Input
                id="convert-deal-name"
                autoComplete="off"
                aria-invalid={errors.dealName ? true : undefined}
                aria-describedby={describedBy('convert-deal-name')}
                {...form.register('dealName')}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                htmlFor="convert-amount"
                label={t('amount_label')}
                error={errors.dealAmount}
              >
                <Input
                  id="convert-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={errors.dealAmount ? true : undefined}
                  aria-describedby={describedBy('convert-amount')}
                  {...form.register('dealAmount')}
                />
              </FormField>
              <FormField
                htmlFor="convert-currency"
                label={t('currency_label')}
                error={errors.dealCurrency}
              >
                <NativeSelect
                  id="convert-currency"
                  aria-invalid={errors.dealCurrency ? true : undefined}
                  aria-describedby={describedBy('convert-currency')}
                  {...form.register('dealCurrency')}
                >
                  {props.currencies.map((currency) => (
                    <NativeSelectOption key={currency.value} value={currency.value}>
                      {currency.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                htmlFor="convert-stage"
                label={t('stage_label')}
                error={errors.dealStageId}
              >
                <NativeSelect
                  id="convert-stage"
                  aria-invalid={errors.dealStageId ? true : undefined}
                  aria-describedby={describedBy('convert-stage')}
                  {...form.register('dealStageId', {
                    setValueAs: (value) => (value ? Number(value) : null),
                  })}
                >
                  {props.stages.map((stage) => (
                    <NativeSelectOption key={stage.id} value={stage.id}>
                      {stage.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <Controller
                control={form.control}
                name="dealCloseDate"
                render={(controller) => (
                  <DateTimeField
                    id="convert-close"
                    label={t('close_label')}
                    value={controller.field.value}
                    onChange={(next) => {
                      controller.field.onChange(next);
                    }}
                    timeZone={props.timeZone}
                    clearable
                    dateOnly
                    error={errors.dealCloseDate}
                  />
                )}
              />
            </div>
          </>
        )}
      </fieldset>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Converts a qualified lead, in a dialog: its company (create it from the lead's company name,
 * link an existing one, or none), its contact (create it from the lead, or link one), and a deal
 * (on by default, named, valued and staged from the lead). Refusals show in the dialog (the
 * deal's under its fields). The result, a fresh conversion or the first one of a repeat
 * (`alreadyConverted`), shows as a `ConversionSummary`; closing the dialog refreshes the page,
 * which then shows the converted lead.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.lead The lead, qualified.
 * @param props.stages The open pipeline stages by position, the deal's choices.
 * @param props.defaultCurrency The workspace's currency, for a lead without one.
 * @param props.currencies The currencies on offer, each with its name in the page's language.
 * @param props.timeZone The workspace's time zone, for the calendar.
 * @param props.headingId The page's heading, which takes the focus when the dialog closes (the
 *   button that opened it goes once the lead is converted).
 * @returns The button, with its dialog.
 */
export const ConvertDialog = (props: ConvertProps & { headingId: string }) => {
  const t = useTranslations('ConvertDialog');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [conversion, setConversion] = useState<Conversion>();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && conversion) {
          router.refresh();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeftIcon data-icon="inline-start" />
          {t('open')}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t('close')}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          const heading =
            conversion && document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`);
          if (heading) {
            event.preventDefault();
            heading.focus();
          }
        }}
      >
        {conversion ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {conversion.alreadyConverted ? t('already_title') : t('done_title')}
              </DialogTitle>
              <DialogDescription>
                {conversion.alreadyConverted ? t('already_text') : t('done_text')}
              </DialogDescription>
            </DialogHeader>
            <ConversionSummary
              workspaceId={props.workspaceId}
              company={conversion.company}
              contact={conversion.contact}
              deal={conversion.deal}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button autoFocus>{t('done')}</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <ConvertForm {...props} onDone={setConversion} />
        )}
      </DialogContent>
    </Dialog>
  );
};
