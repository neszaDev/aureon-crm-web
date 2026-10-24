import { createFormControl } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { applyFieldErrors } from './ApplyFieldErrors';

type Values = { name: string; email: string };

const newForm = () => createFormControl<Values>({ defaultValues: { name: '', email: '' } });
const toField = (name: string) => (name === 'name' || name === 'email' ? name : undefined);
const refused = (fieldErrors: Record<string, string>) => ({
  ok: false,
  message: 'Check the highlighted fields and try again.',
  fieldErrors,
});

describe(applyFieldErrors, () => {
  it('sets each server error on its field', () => {
    const form = newForm();

    applyFieldErrors(form, refused({ name: 'taken', email: 'invalid' }), toField);

    expect(form.getFieldState('name').error).toMatchObject({ type: 'server', message: 'taken' });
    expect(form.getFieldState('email').error).toMatchObject({ type: 'server', message: 'invalid' });
  });

  it('skips a name that maps to no field', () => {
    const form = newForm();

    applyFieldErrors(form, refused({ name: 'taken', links: 'refused' }), toField);

    expect(form.getFieldState('name').error?.message).toBe('taken');
    expect(Object.keys(form.control._formState.errors)).toStrictEqual(['name']);
  });

  it('sets the field a name maps to', () => {
    const form = newForm();

    applyFieldErrors(form, refused({ 'owner.name': 'taken' }), (name) =>
      name === 'owner.name' ? 'name' : undefined,
    );

    expect(form.getFieldState('name').error?.message).toBe('taken');
  });

  it('drops the errors of an earlier submit', () => {
    const form = newForm();
    applyFieldErrors(form, refused({ name: 'taken' }), toField);

    applyFieldErrors(form, refused({ email: 'invalid' }), toField);

    expect(form.getFieldState('name').error).toBeUndefined();
    expect(form.getFieldState('email').error?.message).toBe('invalid');
  });

  it('puts the errors in a new object, as setError edits the old one in place', () => {
    const form = newForm();
    const before = form.control._formState.errors;

    applyFieldErrors(form, refused({ name: 'taken' }), toField);

    expect(form.control._formState.errors).not.toBe(before);
  });

  it('keeps the result when every error found its field', () => {
    const result = refused({ name: 'taken' });

    expect(applyFieldErrors(newForm(), result, toField)).toBe(result);
  });

  it('gives the alert the errors that belong to no field instead of the highlighted-fields text', () => {
    const shown = applyFieldErrors(
      newForm(),
      {
        ...refused({ name: 'taken', version: 'must not be null', deal: 'is invalid' }),
        conflict: true,
      },
      toField,
    );

    expect(shown).toMatchObject({
      ok: false,
      message: 'must not be null is invalid',
      conflict: true,
    });
  });
});
