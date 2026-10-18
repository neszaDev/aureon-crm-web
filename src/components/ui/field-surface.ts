// The surface every form control shares (DESIGN.md, Inputs / Fields): field fill, input-stroke
// border, ply, 16px text (15px from 640px), the border deepening on hover.
export const fieldSurface =
  'rounded-md border border-input bg-field text-base text-foreground shadow-ply transition-[border-color,box-shadow] outline-none hover:border-muted-foreground sm:text-[0.9375rem]';

// Its focus, disabled and error states, on the control itself. A control drawn by a wrapper (a
// tag field around its input) states them with `has-` instead.
export const fieldStates =
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15';
