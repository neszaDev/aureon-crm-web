// The surface every form control shares: field fill, a 3:1 input-stroke border that deepens on
// hover, 16px text on phones (no zoom on focus) and 14px from 640px. Focus is the page's own
// 2px violet outline with its offset (global.css), so the gap shows whatever lies under it.
export const fieldSurface =
  'rounded-md border border-input bg-field text-base text-foreground transition-[border-color] hover:border-muted-foreground sm:text-sm';

// Its disabled and error states, on the control itself. A control drawn by a wrapper (a tag field
// around its input) states them with `has-` instead.
export const fieldStates =
  'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive';
