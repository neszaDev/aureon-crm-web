// Buttons on the public pages' vermilion fields, on top of the shared Button's variants: the main
// action fills with on-seal and writes in seal-deep in both themes (7:1; the lacquer seal-ink would
// be 2.9:1 on it), so it outranks the on-seal outline of the other. Both ring in on-seal.
const ON_SEAL_RING = 'focus-visible:ring-on-seal focus-visible:ring-offset-seal';

export const SEAL_PRIMARY_BUTTON = `border-on-seal bg-on-seal text-seal-deep shadow-ply hover:border-white hover:bg-white ${ON_SEAL_RING}`;

export const SEAL_OUTLINE_BUTTON = `border-on-seal text-on-seal hover:bg-black/10 hover:text-on-seal ${ON_SEAL_RING}`;
