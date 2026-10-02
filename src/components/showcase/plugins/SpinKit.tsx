import { cn } from 'cn';
import type { CSSProperties } from 'react';
import styles from './spinkit.module.css';

/** The SpinKit loaders, in the Vue demo's order. */
export const SPINKIT_LOADERS = [
  'plane',
  'bounce',
  'wave',
  'wander',
  'pulse',
  'chase',
  'swing',
  'flow',
  'circle',
  'grid',
  'circleFade',
  'fold',
] as const;

type SpinKitLoader = (typeof SPINKIT_LOADERS)[number];

const DOTS: Record<SpinKitLoader, number> = {
  plane: 0,
  bounce: 2,
  wave: 5,
  wander: 2,
  pulse: 0,
  chase: 6,
  swing: 2,
  flow: 3,
  circle: 12,
  grid: 9,
  circleFade: 12,
  fold: 4,
};

// Cube grid delays (tenths of a second), row by row: the wave starts bottom-left.
const GRID_DELAYS = [2, 3, 4, 1, 2, 3, 0, 1, 2];
// Folding cube: the cubes fold in turn around the square (top-left, top-right, bottom-right, bottom-left).
const FOLD = [
  { turn: '0deg', delay: '0s' },
  { turn: '90deg', delay: '0.3s' },
  { turn: '270deg', delay: '0.9s' },
  { turn: '180deg', delay: '0.6s' },
];

type DotStyle = CSSProperties & Record<`--${string}`, string | number>;

const dotStyle = (loader: SpinKitLoader, index: number): DotStyle => {
  if (loader === 'grid') {
    return { '--grid-delay': GRID_DELAYS[index] ?? 0 };
  }
  if (loader === 'fold') {
    return {
      '--fold-turn': FOLD[index]?.turn ?? '0deg',
      '--fold-delay': FOLD[index]?.delay ?? '0s',
    };
  }
  return { '--i': index };
};

/**
 * A SpinKit loader drawn with CSS in folder green. Decorative: name it in the surrounding text.
 * Static under reduced motion.
 * @param props Component props.
 * @param props.loader Which loader to draw.
 * @returns The loader.
 */
export const SpinKit = (props: { loader: SpinKitLoader }) => (
  <div aria-hidden="true" className={cn(styles.loader, styles[props.loader])}>
    {Array.from({ length: DOTS[props.loader] }, (_, index) => (
      <span key={index} style={dotStyle(props.loader, index)} />
    ))}
  </div>
);

/**
 * The "grow" spinner: a dot that swells and fades. Static under reduced motion.
 * @param props Component props.
 * @param props.className Size and colour classes.
 * @param props.label Accessible name.
 * @returns The spinner.
 */
export const GrowSpinner = (props: { className?: string; label: string }) => (
  <output aria-label={props.label} className={cn('size-6', styles.grow, props.className)} />
);
