import { describe, expect, it } from 'vitest';
import { ComposeValidation, splitAddresses } from './composeValidation';

const valid = { to: 'ada@example.com', cc: '', bcc: '', subject: '' };
const issues = (values: typeof valid) => {
  const result = ComposeValidation.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => [issue.path[0], issue.message]);
};

describe(splitAddresses, () => {
  it('splits on commas and semicolons and drops blanks', () => {
    expect(splitAddresses(' a@x.org, b@y.org;;c@z.org ,')).toStrictEqual([
      'a@x.org',
      'b@y.org',
      'c@z.org',
    ]);
  });
});

describe('Compose form rules', () => {
  it('accepts one recipient and empty optional fields', () => {
    expect(issues(valid)).toStrictEqual([]);
  });

  it('requires a recipient', () => {
    expect(issues({ ...valid, to: '  ' })).toStrictEqual([['to', 'required']]);
  });

  it('rejects a list with one malformed address', () => {
    expect(issues({ ...valid, cc: 'ben@example.com, not-an-address' })).toStrictEqual([
      ['cc', 'invalid_email_list'],
    ]);
  });
});
