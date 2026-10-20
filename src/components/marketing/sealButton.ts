// Buttons on the public pages' vermilion fields, on top of the shared Button's variants: the main
// action fills with the field and writes in seal-ink, the other is an on-seal outline. Both ring in
// on-seal on the seal.
const ON_SEAL_RING = 'focus-visible:ring-on-seal focus-visible:ring-offset-seal';

export const SEAL_FIELD_BUTTON = `border-field bg-field text-seal-ink shadow-ply hover:bg-seal-tint ${ON_SEAL_RING}`;

export const SEAL_OUTLINE_BUTTON = `border-on-seal text-on-seal hover:bg-black/10 hover:text-on-seal ${ON_SEAL_RING}`;
