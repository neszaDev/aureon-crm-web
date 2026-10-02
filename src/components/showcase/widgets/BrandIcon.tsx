import {
  cibCcAmex,
  cibCcMastercard,
  cibCcVisa,
  cibFacebook,
  cibGooglePay,
  cibLinkedin,
  cibPaypal,
  cibStripe,
  cibTwitter,
} from '@coreui/icons';
import { cn } from 'cn';

const BRANDS = {
  facebook: cibFacebook,
  twitter: cibTwitter,
  linkedin: cibLinkedin,
  mastercard: cibCcMastercard,
  visa: cibCcVisa,
  stripe: cibStripe,
  paypal: cibPaypal,
  googlePay: cibGooglePay,
  amex: cibCcAmex,
} as const;

export type Brand = keyof typeof BRANDS;

const PATH = /\sd='([^']+)'/gu;

/**
 * A one-colour brand logo from `@coreui/icons`, drawn in the current text colour
 * (Lucide ships no brand marks).
 * @param props Component props.
 * @param props.brand Which logo.
 * @param props.label Accessible name; without it the logo is decorative.
 * @param props.className Size and colour classes.
 * @returns The logo as an inline SVG.
 */
export const BrandIcon = (props: { brand: Brand; label?: string; className?: string }) => {
  const [size = '32 32', markup = ''] = BRANDS[props.brand];
  const paths = [...markup.matchAll(PATH)].map((match) => match[1] ?? '');

  return (
    <svg
      viewBox={`0 0 ${size}`}
      fill="currentColor"
      className={cn('size-5 shrink-0', props.className)}
      {...(props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': true })}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};
