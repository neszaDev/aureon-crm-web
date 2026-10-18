import { createFormControl } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { applyFieldErrors } from './ApplyFieldErrors';

type Values = { name: string; email: string };

const newForm = () => createFormControl<Values>({ defaultValues: { name: '', email: '' } });
const toField = (name: string) => (name === 'name' || name === 'email' ? name : undefined);

describe(applyFieldErrors, () => {
  it('sets each server error on its field', () => {
    const form = newForm();

    applyFieldErrors(form, { name: 'taken', email: 'invalid' }, toField);

    expect(form.getFieldState('name').error).toMatchObject({ type: 'server', message: 'taken' });
    expect(form.getFieldState('email').error).toMatchObject({ type: 'server', message: 'invalid' });
  });

  it('skips a name that maps to no field', () => {
    const form = newForm();

    applyFieldErrors(form, { name: 'taken', links: 'refused' }, toField);

    expect(form.getFieldState('name').error?.message).toBe('taken');
    expect(Object.keys(form.control._formState.errors)).toStrictEqual(['name']);
  });

  it('sets the field a name maps to', () => {
    const form = newForm();

    applyFieldErrors(form, { 'owner.name': 'taken' }, (name) =>
      name === 'owner.name' ? 'name' : undefined,
    );

    expect(form.getFieldState('name').error?.message).toBe('taken');
  });

  it('drops the errors of an earlier submit', () => {
    const form = newForm();
    applyFieldErrors(form, { name: 'taken' }, toField);

    applyFieldErrors(form, { email: 'invalid' }, toField);

    expect(form.getFieldState('name').error).toBeUndefined();
    expect(form.getFieldState('email').error?.message).toBe('invalid');
  });

  it('puts the errors in a new object, as setError edits the old one in place', () => {
    const form = newForm();
    const before = form.control._formState.errors;

    applyFieldErrors(form, { name: 'taken' }, toField);

    expect(form.control._formState.errors).not.toBe(before);
  });
});
