import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * An icon button of the toolbar.
 * @param props Component props.
 * @param props.label Accessible name.
 * @param props.onClick Called on click.
 * @param props.disabled Disable the button.
 * @param props.pressed Toggle state, for toggle buttons.
 * @param props.children The icon.
 * @returns The button.
 */
export const ToolButton = (props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    aria-label={props.label}
    aria-pressed={props.pressed}
    disabled={props.disabled}
    onClick={() => {
      props.onClick();
    }}
    className="aria-pressed:bg-ink-100 aria-pressed:text-folder"
  >
    {props.children}
  </Button>
);

/**
 * A toolbar icon that navigates, or a disabled button when there is nowhere to go.
 * @param props Component props.
 * @param props.label Accessible name.
 * @param props.href Destination; omitted to disable.
 * @param props.children The icon.
 * @returns The link or the disabled button.
 */
export const ToolLink = (props: { label: string; href?: string; children: React.ReactNode }) =>
  props.href ? (
    <Button asChild variant="ghost" size="icon-sm">
      <Link href={props.href} aria-label={props.label}>
        {props.children}
      </Link>
    </Button>
  ) : (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={props.label} disabled>
      {props.children}
    </Button>
  );
