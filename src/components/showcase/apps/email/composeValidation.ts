import * as z from 'zod';

const address = z.email();

/**
 * Splits a recipients field ("a@x.org, b@y.org; c@z.org") into addresses.
 * @param value The field value.
 * @returns The trimmed, non-empty addresses.
 */
export const splitAddresses = (value: string) =>
  value
    .split(/[,;]/u)
    .map((part) => part.trim())
    .filter(Boolean);

const addressList = z
  .string()
  .trim()
  .refine(
    (value) => splitAddresses(value).every((part) => address.safeParse(part).success),
    'invalid_email_list',
  );

// The compose form; messages are `Validation` keys.
export const ComposeValidation = z.object({
  to: addressList.refine((value) => value !== '', 'required'),
  cc: addressList,
  bcc: addressList,
  subject: z.string().trim().max(200, 'too_long'),
});

export type ComposeValues = z.infer<typeof ComposeValidation>;
