/**
 * The Marksheet stand-ins for the eight Bootstrap colour variants the CoreUI base demos cycle
 * through, in the Vue order: primary → folder, secondary → ink, success → pass,
 * warning → pencil, info → deep (folder deep), danger → pen, light → light (ink 300),
 * dark → dark (ink 950). Red pen keeps its meaning: it stands for the error/danger slot only.
 */
export const TONES = ['folder', 'ink', 'pass', 'pencil', 'deep', 'pen', 'light', 'dark'] as const;

export type Tone = (typeof TONES)[number];

/** A whole surface filled with the tone, with readable text on it. */
export const toneSolid: Record<Tone, string> = {
  folder: 'bg-folder text-folder-ink',
  ink: 'bg-ink-600 text-ply',
  pass: 'bg-pass text-ply',
  pencil: 'bg-pencil text-ply',
  deep: 'bg-folder-deep text-folder-ink',
  pen: 'bg-pen text-ply',
  light: 'bg-ink-200 text-ink-950',
  dark: 'bg-ink-950 text-ply',
};

/** A bar or dot filled with the tone (no text on it). */
export const toneFill: Record<Tone, string> = {
  folder: 'bg-folder',
  ink: 'bg-ink-600',
  pass: 'bg-pass',
  pencil: 'bg-pencil',
  deep: 'bg-folder-deep',
  pen: 'bg-pen',
  light: 'bg-ink-300',
  dark: 'bg-ink-950',
};

/** A border drawn in the tone. */
export const toneBorder: Record<Tone, string> = {
  folder: 'border-folder',
  ink: 'border-ink-600',
  pass: 'border-pass',
  pencil: 'border-pencil',
  deep: 'border-folder-deep',
  pen: 'border-pen',
  light: 'border-ink-300',
  dark: 'border-ink-950',
};

/** A light wash of the tone with text printed in it, for contextual rows. */
export const toneSoft: Record<Tone, string> = {
  folder: 'bg-folder/10 text-folder',
  ink: 'bg-ink-600/10 text-ink-700',
  pass: 'bg-pass/10 text-pass',
  pencil: 'bg-pencil/10 text-pencil',
  deep: 'bg-folder-deep/10 text-folder-deep',
  pen: 'bg-pen/10 text-pen',
  light: 'bg-ply text-ink-700',
  dark: 'bg-ink-950/10 text-ink-950',
};

/** The hover state of a `toneSoft` row that is a link. */
export const toneSoftHover: Record<Tone, string> = {
  folder: 'hover:bg-folder/20',
  ink: 'hover:bg-ink-600/20',
  pass: 'hover:bg-pass/20',
  pencil: 'hover:bg-pencil/20',
  deep: 'hover:bg-folder-deep/20',
  pen: 'hover:bg-pen/20',
  light: 'hover:bg-paper-card',
  dark: 'hover:bg-ink-950/20',
};

/** A top rule in the tone, for accent cards. */
export const toneAccent: Record<Tone, string> = {
  folder: 'border-t-folder',
  ink: 'border-t-ink-600',
  pass: 'border-t-pass',
  pencil: 'border-t-pencil',
  deep: 'border-t-folder-deep',
  pen: 'border-t-pen',
  light: 'border-t-ink-300',
  dark: 'border-t-ink-950',
};
