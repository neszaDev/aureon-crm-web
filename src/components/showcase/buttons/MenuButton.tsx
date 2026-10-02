import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ButtonProps = React.ComponentProps<typeof Button>;
type ContentProps = React.ComponentProps<typeof DropdownMenuContent>;

const ICON_SIZE = { sm: 'icon-sm', default: 'icon', lg: 'icon-lg' } as const;

/**
 * A button that opens a dropdown menu; split, it is an action button plus a separate caret
 * trigger. Put a split one inside a `ButtonGroup` so the halves join.
 * @param props Component props.
 * @param props.label Text of the button.
 * @param props.variant Button variant.
 * @param props.size Button size (`sm`, `default` or `lg`).
 * @param props.split Show the caret as its own trigger next to the action.
 * @param props.caret Show the caret (default true; ignored when split).
 * @param props.align Menu alignment against the trigger.
 * @param props.side Side the menu opens on.
 * @param props.sideOffset Gap between trigger and menu, in px.
 * @param props.alignOffset Shift along the alignment axis, in px.
 * @param props.className Extra classes for the trigger.
 * @param props.children The menu items.
 * @returns The trigger(s) and the menu.
 */
export const MenuButton = (props: {
  label: React.ReactNode;
  variant?: ButtonProps['variant'];
  size?: 'sm' | 'default' | 'lg';
  split?: boolean;
  caret?: boolean;
  align?: ContentProps['align'];
  side?: ContentProps['side'];
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
  children: React.ReactNode;
}) => {
  const t = useTranslations('MenuButton');
  const variant = props.variant ?? 'outline';
  const size = props.size ?? 'default';
  const content = (
    <DropdownMenuContent
      align={props.align}
      side={props.side}
      sideOffset={props.sideOffset}
      alignOffset={props.alignOffset}
      className="w-auto min-w-44"
    >
      {props.children}
    </DropdownMenuContent>
  );

  if (props.split) {
    return (
      <>
        <Button variant={variant} size={size} className={props.className}>
          {props.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={ICON_SIZE[size]} aria-label={t('toggle_menu')}>
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          {content}
        </DropdownMenu>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={props.className}>
          {props.label}
          {props.caret !== false && <ChevronDownIcon data-icon="inline-end" />}
        </Button>
      </DropdownMenuTrigger>
      {content}
    </DropdownMenu>
  );
};
