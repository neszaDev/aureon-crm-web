'use client';

import {
  CalendarIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  DropletIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useIMask } from 'react-imask';
import { describedBy, FormField } from '@/components/FormField';
import { InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { FieldGroup } from './FieldGroup';

type MaskSpec = {
  /** IMask pattern: `0` is any digit; the other letters are defined in `definitions`. */
  mask: string;
  definitions?: Record<string, RegExp>;
  placeholderChar: string;
  /** Show the guide even before the field is focused. */
  alwaysShow?: boolean;
  /** Typing replaces the character under the caret instead of shifting the rest. */
  overwrite?: boolean;
};

// The masks of the Vue page (vue-text-mask), written as IMask patterns.
const MASKS = {
  date: {
    mask: 'D0/D0/0000',
    definitions: { D: /[0-3]/u },
    placeholderChar: '_',
    alwaysShow: true,
    overwrite: true,
  },
  phone: { mask: '(N00) 000-0000', definitions: { N: /[1-9]/u }, placeholderChar: '#' },
  tax_id: { mask: '00-0000000', placeholderChar: '#' },
  ssn: { mask: '000-00-0000', placeholderChar: '#' },
  eye_script: { mask: '~0.00 ~0.00 000', placeholderChar: '#' },
  card_number: { mask: '0000 0000 0000 0000', placeholderChar: '#' },
} satisfies Record<string, MaskSpec>;

const FIELDS = ['date', 'phone', 'tax_id', 'ssn', 'eye_script', 'card_number'] as const;

const EXAMPLES: Record<keyof typeof MASKS, string> = {
  date: '99/99/9999',
  phone: '(999) 999-9999',
  tax_id: '99-9999999',
  ssn: '999-99-9999',
  eye_script: '~9.99 ~9.99 999',
  card_number: '9999 9999 9999 9999',
};

const ICONS: Record<keyof typeof MASKS, React.ReactNode> = {
  date: <CalendarIcon aria-hidden="true" />,
  phone: <PhoneIcon aria-hidden="true" />,
  tax_id: <CircleDollarSignIcon aria-hidden="true" />,
  ssn: <UserIcon aria-hidden="true" />,
  eye_script: <DropletIcon aria-hidden="true" />,
  card_number: <CreditCardIcon aria-hidden="true" />,
};

const MaskedField = (props: {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  spec: MaskSpec;
  type?: 'text' | 'tel';
}) => {
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(false);
  // Like vue-text-mask's guide: the placeholder characters appear once you are in the field.
  const { ref } = useIMask<HTMLInputElement>(
    {
      mask: props.spec.mask,
      definitions: props.spec.definitions,
      placeholderChar: props.spec.placeholderChar,
      overwrite: props.spec.overwrite,
      lazy: !((props.spec.alwaysShow ?? false) || focused || filled),
    },
    {
      onAccept: (_value, mask) => {
        setFilled(mask.unmaskedValue !== '');
      },
    },
  );

  return (
    <FormField htmlFor={props.id} label={props.label} hint={props.hint}>
      <FieldGroup>
        <InputGroupAddon>{props.icon}</InputGroupAddon>
        <InputGroupInput
          ref={ref}
          id={props.id}
          name={props.id}
          type={props.type ?? 'text'}
          inputMode="numeric"
          autoComplete="off"
          className="tabular-nums"
          aria-describedby={describedBy(props.id)}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
        />
      </FieldGroup>
    </FormField>
  );
};

/**
 * The masked inputs of the advanced forms page: date, phone, taxpayer id, social security
 * number, eye script and card number, each typed into a fixed pattern.
 * @returns The fields.
 */
export const MaskedInputs = () => {
  const t = useTranslations('AdvancedFormsPage');
  return (
    <div className="flex flex-col gap-5">
      {FIELDS.map((key) => (
        <MaskedField
          key={key}
          id={`masked-${key}`}
          label={t(`mask_${key}`)}
          hint={t('mask_example', { example: EXAMPLES[key] })}
          icon={ICONS[key]}
          spec={MASKS[key]}
          type={key === 'phone' ? 'tel' : 'text'}
        />
      ))}
    </div>
  );
};
