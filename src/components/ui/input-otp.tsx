'use client';

import { cn } from 'cn';
import { OTPInput, OTPInputContext } from 'input-otp';
import * as React from 'react';

// Themed for Marksheet: each slot is an Input-sized box on the white ply.
function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'cn-input-otp flex items-center has-disabled:opacity-50',
        containerClassName,
      )}
      spellCheck={false}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        'flex items-center rounded-md has-aria-invalid:border-pen has-aria-invalid:ring-3 has-aria-invalid:ring-pen/15',
        className,
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'relative flex size-10 items-center justify-center border-y border-r border-input bg-ply text-base text-ink-900 shadow-ply transition-[border-color,box-shadow] outline-none first:rounded-l-md first:border-l last:rounded-r-md aria-invalid:border-pen data-[active=true]:z-10 data-[active=true]:border-folder data-[active=true]:ring-3 data-[active=true]:ring-folder/20 data-[active=true]:aria-invalid:border-pen data-[active=true]:aria-invalid:ring-pen/15',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-folder duration-1000" />
        </div>
      )}
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot };
