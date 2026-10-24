import * as z from 'zod';
import type { components } from '@/libs/api/schema';
import { CurrencyCode, MoneyAmount } from './MoneyValidation';

/** The Deals page's views: the board (default) or the table. */
export const DEAL_VIEWS = ['board', 'list'] as const;

/** The view without `?view=`: the page shows it, and its export takes what it applies. */
export const DEFAULT_DEAL_VIEW = 'board' satisfies (typeof DEAL_VIEWS)[number];

/** A deal's status: the kind of its stage. */
export const DEAL_STATUSES = ['OPEN', 'WON', 'LOST'] as const;

const optionalId = z.number().int().positive().nullable();
// A text field that may be empty (none), or else holds what `schema` takes.
const emptyOr = (schema: z.ZodType, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || schema.safeParse(value).success, message);
/** The longest reason a deal can be lost for (the backend's `lostReason`). */
export const REASON_MAX = 500;
const Reason = z.string().trim().max(REASON_MAX, 'too_long');

// Mirrors the backend's DealInput (Create/UpdateDealRequest). Messages are `Validation`
// translation keys. Text fields hold what the inputs hold; an empty one is sent as absent, which
// clears it on an update. `stageId` counts on create only (an open stage: the form offers no
// other, and the backend checks); an update has none.
export const DealValidation = z.object({
  name: z.string().trim().min(1, 'required').max(200, 'too_long'),
  amount: MoneyAmount,
  // Empty: the workspace's currency applies.
  currency: emptyOr(CurrencyCode, 'invalid_currency'),
  stageId: optionalId,
  // Empty: the stage's own probability applies.
  probability: emptyOr(
    z
      .string()
      .regex(/^\d{1,3}$/u)
      .refine((value) => Number(value) <= 100),
    'probability_range',
  ),
  expectedCloseDate: emptyOr(z.iso.date(), 'invalid_date'),
  // Null: unassigned when editing, the caller when creating (as the backend reads it).
  ownerId: optionalId,
  companyId: optionalId,
  contactId: optionalId,
  sourceId: optionalId,
  notes: z.string().trim().max(5000, 'too_long'),
});

export type DealValues = z.infer<typeof DealValidation>;

/**
 * The form's values of a saved deal: what the inputs hold, an absent field empty. The deal's
 * own probability is set only when it overrides its stage's.
 * @param deal The deal.
 * @returns The values: what an edit starts from, and what an owner change sends back unchanged.
 */
export const dealValues = (deal: components['schemas']['DealResponse']): DealValues => ({
  name: deal.name,
  amount: deal.amount,
  currency: deal.currency,
  stageId: null,
  probability: deal.probabilityOverride === undefined ? '' : String(deal.probabilityOverride),
  expectedCloseDate: deal.expectedCloseDate ?? '',
  ownerId: deal.owner?.userId ?? null,
  companyId: deal.company?.id ?? null,
  contactId: deal.contact?.id ?? null,
  sourceId: deal.source?.id ?? null,
  notes: deal.notes ?? '',
});

/**
 * The Move dialog's fields: the stage, and the reason when that stage is Lost (`lost`, which the
 * dialog sets from the stage's kind). A reason counts, and is checked, only for Lost.
 */
export const MoveFormValidation = z
  .object({
    stageId: z.number().int().positive(),
    lost: z.boolean(),
    // Whatever was typed: another stage ignores it, so only Lost checks it.
    lostReason: z.string().trim(),
  })
  .superRefine((move, context) => {
    if (!move.lost) {
      return;
    }
    if (move.lostReason === '') {
      context.addIssue({ code: 'custom', message: 'required', path: ['lostReason'] });
    } else if (move.lostReason.length > REASON_MAX) {
      context.addIssue({ code: 'custom', message: 'too_long', path: ['lostReason'] });
    }
  });

export type MoveFormValues = z.infer<typeof MoveFormValidation>;

/** What the Lost dialog asks for when a card is dropped on Lost: why the deal was lost. */
export const LostReasonValidation = z.object({ reason: Reason.min(1, 'required') });

export type LostReasonValues = z.infer<typeof LostReasonValidation>;

/**
 * A move as the action sends it (api.md `MoveDealRequest`): the stage, the version the deal was
 * read at, and the reason, which the backend requires for Lost and drops for any other stage.
 */
export const MoveValidation = z.object({
  stageId: z.number().int().positive(),
  version: z.number().int().min(0),
  lostReason: Reason.optional(),
});

export type MoveValues = z.infer<typeof MoveValidation>;
