import { cn } from 'cn';
import { InputGroup } from '@/components/ui/input-group';

/**
 * An input group on the white ply: the control and its addons (text, icons, buttons) share one
 * bordered field, sized like `Input`.
 * @param props Component props.
 * @param props.className Extra classes.
 * @param props.children `InputGroupInput` plus `InputGroupAddon`s.
 * @returns The grouped field.
 */
export const FieldGroup = (props: { className?: string; children: React.ReactNode }) => (
  <InputGroup
    className={cn(
      'h-10 rounded-md bg-ply shadow-ply hover:border-ink-400 has-[[data-slot=input-group-control]:focus-visible]:ring-folder/20 has-[[data-slot][aria-invalid=true]]:border-pen has-[[data-slot][aria-invalid=true]]:ring-pen/15',
      props.className,
    )}
  >
    {props.children}
  </InputGroup>
);
