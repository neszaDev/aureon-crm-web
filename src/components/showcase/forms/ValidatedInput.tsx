'use client';

import { cn } from 'cn';
import { useState } from 'react';
import * as z from 'zod';
import { describedBy } from '@/components/FormField';
import { Mark } from '@/components/report/Mark';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** What a validated demo input checks: nothing, presence, at least 4 characters, or an email. */
export type InputRule = 'optional' | 'required' | 'min_length_4' | 'email';

const emailSchema = z.email();

/**
 * Checks a value against a demo input rule.
 * @param value The input's value.
 * @param rule The rule to apply.
 * @returns Whether the value passes.
 */
const RULES: Record<InputRule, (value: string) => boolean> = {
  optional: () => true,
  required: (value) => value.trim() !== '',
  min_length_4: (value) => value.length >= 4,
  email: (value) => emailSchema.safeParse(value).success,
};

export const passesRule = (value: string, rule: InputRule) => RULES[rule](value);

/**
 * A labelled input that shows its validation state from the first render and as you type:
 * a pass tick with the valid feedback, or the invalid feedback in red pen.
 * @param props Component props.
 * @param props.id Id of the input.
 * @param props.label Visible label.
 * @param props.rule The rule the value must pass.
 * @param props.type Input type.
 * @param props.defaultValue Initial value.
 * @param props.placeholder Placeholder text.
 * @param props.autoComplete Autocomplete hint.
 * @param props.hint Help text shown under the input, whatever the state.
 * @param props.validFeedback Text shown while the value passes.
 * @param props.invalidFeedback Text shown while it does not.
 * @returns The validated field.
 */
export const ValidatedInput = (props: {
  id: string;
  label: React.ReactNode;
  rule: InputRule;
  type?: 'text' | 'email' | 'password';
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: React.ReactNode;
  validFeedback?: React.ReactNode;
  invalidFeedback?: React.ReactNode;
}) => {
  const [value, setValue] = useState(props.defaultValue ?? '');
  const valid = passesRule(value, props.rule);
  const feedback = valid ? props.validFeedback : props.invalidFeedback;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type={props.type ?? 'text'}
        value={value}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required={props.rule !== 'optional'}
        aria-invalid={valid ? undefined : true}
        aria-describedby={describedBy(props.id)}
        className={cn(valid && 'border-pass hover:border-pass')}
        onChange={(event) => {
          setValue(event.currentTarget.value);
        }}
      />
      <div id={describedBy(props.id)} className="flex flex-col gap-1 text-[0.8125rem]">
        {feedback && (
          <p
            className={cn(
              'flex items-center gap-1.5 font-medium',
              valid ? 'text-pass' : 'text-pen',
            )}
          >
            {valid && <Mark status="PASSED" className="size-3.5" />}
            {feedback}
          </p>
        )}
        {props.hint && <p className="text-ink-600">{props.hint}</p>}
      </div>
    </div>
  );
};
