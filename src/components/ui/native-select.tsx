import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
};

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        'group/native-select relative w-full has-[select:disabled]:opacity-50',
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-10 w-full min-w-0 appearance-none rounded-md border border-input bg-ply py-2 pr-9 pl-3 text-base text-ink-900 shadow-ply transition-[border-color,box-shadow] outline-none select-none placeholder:text-ink-400 hover:border-ink-400 focus-visible:border-folder focus-visible:ring-3 focus-visible:ring-folder/20 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:opacity-60 aria-invalid:border-pen aria-invalid:ring-3 aria-invalid:ring-pen/15 data-[size=sm]:h-8 data-[size=sm]:py-1 data-[size=sm]:pr-8 data-[size=sm]:pl-2.5 data-[size=sm]:text-sm sm:text-[0.9375rem]"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-600 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot="native-select-option"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOption };
