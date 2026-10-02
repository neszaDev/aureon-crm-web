/**
 * The Marksheet stand-ins for the Bootstrap colour variants the CoreUI widgets used:
 * primary → folder, success → pass, info → ink, warning → slate (ink 600/400), danger → pencil.
 * Red pen stays reserved for errors, so no demo variant uses it.
 */
export type Tone = 'folder' | 'pass' | 'ink' | 'slate' | 'pencil';

/** A filled bar or dot on card stock. */
export const toneFill: Record<Tone, string> = {
  folder: 'bg-folder',
  pass: 'bg-pass',
  ink: 'bg-ink-900',
  slate: 'bg-ink-400',
  pencil: 'bg-pencil',
};

/** A whole card or band filled with the tone; text on it is folder ink. */
export const toneSolid: Record<Tone, string> = {
  folder: 'bg-folder',
  pass: 'bg-pass',
  ink: 'bg-ink-900',
  slate: 'bg-ink-600',
  pencil: 'bg-pencil',
};

/** A figure printed in the tone on card stock. */
export const toneText: Record<Tone, string> = {
  folder: 'text-folder',
  pass: 'text-pass',
  ink: 'text-ink-900',
  slate: 'text-ink-600',
  pencil: 'text-pencil',
};

/** The tone as a CSS colour, for chart strokes and fills. */
export const toneColor: Record<Tone, string> = {
  folder: 'var(--folder)',
  pass: 'var(--pass)',
  ink: 'var(--ink-900)',
  slate: 'var(--ink-400)',
  pencil: 'var(--pencil)',
};

/** A left rule in the tone, for callouts. */
export const toneBorder: Record<Tone, string> = {
  folder: 'border-folder',
  pass: 'border-pass',
  ink: 'border-ink-900',
  slate: 'border-ink-400',
  pencil: 'border-pencil',
};
