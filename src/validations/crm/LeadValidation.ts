import * as z from 'zod';
import { EMAIL } from './ContactValidation';
import { CurrencyCode, MoneyAmount } from './MoneyValidation';

/** A lead's statuses, in the order of its lifecycle. */
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'] as const;

/** The statuses a status change takes: CONVERTED is reached only by converting. */
export const LEAD_TARGETS = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'] as const;

/** A lead's priorities, lowest first. */
export const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

const optionalText = (max: number) => z.string().trim().max(max, 'too_long');
const optionalId = z.number().int().positive().nullable();
// A text field that may be empty (none), or else holds what `schema` takes.
const emptyOr = (schema: z.ZodType, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || schema.safeParse(value).success, message);
// A record a picker linked: its id, and its name for the field to show.
const picked = z.object({ id: z.number().int().positive(), label: z.string() }).nullable();

// Mirrors the backend's LeadInput (Create/UpdateLeadRequest). Messages are `Validation`
// translation keys. Text fields hold what the inputs hold; an empty one is sent as absent. The
// value comes out as the backend stores it (the email in lower case).
export const LeadValidation = z
  .object({
    firstName: z.string().trim().min(1, 'required').max(100, 'too_long'),
    lastName: optionalText(100),
    companyName: optionalText(200),
    email: z
      .string()
      .trim()
      .max(254, 'too_long')
      .refine((value) => value === '' || EMAIL.test(value), 'invalid_email')
      .toLowerCase(),
    phone: optionalText(50),
    jobTitle: optionalText(100),
    sourceId: optionalId,
    // Null: unassigned when editing, the caller when creating (as the backend reads it).
    ownerId: optionalId,
    priority: z.enum(LEAD_PRIORITIES),
    followUpDate: emptyOr(z.iso.date(), 'invalid_date'),
    estimatedValue: emptyOr(MoneyAmount, 'money_format'),
    // Empty with a value: the workspace's currency applies.
    currency: emptyOr(CurrencyCode, 'invalid_currency'),
    notes: optionalText(5000),
  })
  .refine((lead) => lead.currency === '' || lead.estimatedValue !== '', {
    message: 'required',
    path: ['estimatedValue'],
  });

export type LeadValues = z.infer<typeof LeadValidation>;

const Reason = z.string().trim().max(500, 'too_long');

/** What the Unqualify dialog asks for: why the lead isn't a fit. */
export const UnqualifyValidation = z.object({ reason: Reason.min(1, 'required') });

export type UnqualifyValues = z.infer<typeof UnqualifyValidation>;

/** A status change as the action takes it: UNQUALIFIED needs its reason, the others have none. */
export const LeadStatusValidation = z
  .object({ status: z.enum(LEAD_TARGETS), reason: Reason })
  .refine((change) => change.status !== 'UNQUALIFIED' || change.reason !== '', {
    message: 'required',
    path: ['reason'],
  });

export type LeadStatusChange = z.infer<typeof LeadStatusValidation>;

/**
 * The Convert dialog's fields: how the company and the contact are made or linked, and the deal
 * (its fields count only while it is on). Fields hold what the inputs hold.
 */
export const ConvertFormValidation = z
  .object({
    company: z.enum(['create', 'link', 'none']),
    companyLink: picked,
    contact: z.enum(['create', 'link']),
    contactLink: picked,
    deal: z.boolean(),
    dealName: z.string().trim().max(200, 'too_long'),
    dealAmount: z.string().trim(),
    dealCurrency: z.string(),
    dealStageId: optionalId,
    dealCloseDate: emptyOr(z.iso.date(), 'invalid_date'),
  })
  .superRefine((values, context) => {
    const refuse = (path: string, message: string) => {
      context.addIssue({ code: 'custom', message, path: [path] });
    };
    if (values.company === 'link' && !values.companyLink) {
      refuse('companyLink', 'required');
    }
    if (values.contact === 'link' && !values.contactLink) {
      refuse('contactLink', 'required');
    }
    if (!values.deal) {
      return;
    }
    if (!values.dealName) {
      refuse('dealName', 'required');
    }
    if (!MoneyAmount.safeParse(values.dealAmount).success) {
      refuse('dealAmount', 'money_format');
    }
    if (!CurrencyCode.safeParse(values.dealCurrency).success) {
      refuse('dealCurrency', 'invalid_currency');
    }
  });

export type ConvertFormValues = z.infer<typeof ConvertFormValidation>;

/**
 * A conversion as the action sends it (api.md `LeadConversionInput`): the company to link, or
 * whether to create one from the lead's company name; the contact to link, or none to create
 * one; and the deal, or none.
 */
export const ConversionValidation = z.object({
  companyId: optionalId,
  createCompany: z.boolean(),
  contactId: optionalId,
  deal: z
    .object({
      name: z.string().trim().min(1, 'required').max(200, 'too_long'),
      amount: MoneyAmount,
      currency: CurrencyCode,
      stageId: optionalId,
      expectedCloseDate: z.iso.date().nullable(),
    })
    .nullable(),
});

export type ConversionValues = z.infer<typeof ConversionValidation>;
