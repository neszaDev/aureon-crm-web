import { cn } from 'cn';
import { Loader2Icon } from 'lucide-react';

type SpinnerProps = React.ComponentProps<'svg'> &
  // A spinner either announces itself (`label`) or is decorative beside visible text.
  ({ label: string } | { label?: never; 'aria-hidden': true | 'true' });

function Spinner({ className, label, ...props }: SpinnerProps) {
  const icon = (
    <Loader2Icon
      data-slot="spinner"
      className={cn('size-4 animate-spin', className)}
      {...props}
      aria-hidden="true"
    />
  );

  if (label === undefined) {
    return icon;
  }

  return (
    <output aria-label={label} className="inline-flex">
      {icon}
    </output>
  );
}

export { Spinner };
