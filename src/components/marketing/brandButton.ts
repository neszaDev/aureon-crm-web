// Buttons on the public pages' violet fields (the deep violet tint in the dark theme), on top of
// the shared Button's variants: the main action fills with white and writes in Aureon violet
// (6.25:1) in both themes, so it outranks the white outline of the other. Both ring in white.
const ON_BRAND_RING =
  'focus-visible:ring-white focus-visible:ring-offset-violet dark:focus-visible:ring-offset-violet-tint';

export const BRAND_PRIMARY_BUTTON = `border-white bg-white text-violet hover:border-violet-tint hover:bg-violet-tint dark:hover:border-white/90 dark:hover:bg-white/90 ${ON_BRAND_RING}`;

export const BRAND_OUTLINE_BUTTON = `border-white/80 bg-transparent text-white hover:border-white hover:bg-white/12 hover:text-white ${ON_BRAND_RING}`;

// The landing page's two main actions (the hero's and the closing band's): 44 px, a size up from
// the app's (DESIGN.md records the exception).
export const LANDING_ACTION = 'h-11 px-5 text-[0.9375rem]';
