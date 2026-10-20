import { cn } from 'cn';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';

/**
 * A spot on a capture, in percent of the image, that its section's developer note rings: drawn
 * at rest, ringed fully while the note is hovered.
 */
export type Spot = { left: string; top: string; width: string; height: string };

/**
 * A real capture of the app on a paper sheet: the light capture, or the lacquer one under the
 * dark theme (the other is `display: none` and, lazy, never loads).
 * @param props Component props.
 * @param props.light The light capture.
 * @param props.dark The lacquer capture.
 * @param props.alt What the capture shows.
 * @param props.sizes The displayed width, for the image optimiser.
 * @param props.spot The part of the capture the section's note is about.
 * @param props.className Extra classes for the sheet.
 * @returns The sheet.
 */
export const Shot = (props: {
  light: StaticImageData;
  dark: StaticImageData;
  alt: string;
  sizes: string;
  spot?: Spot;
  className?: string;
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-lg border border-rule bg-paper',
      props.className,
    )}
  >
    <Image
      src={props.light}
      alt={props.alt}
      sizes={props.sizes}
      className="block h-auto w-full dark:hidden"
    />
    <Image
      src={props.dark}
      alt={props.alt}
      sizes={props.sizes}
      className="hidden h-auto w-full dark:block"
    />
    {props.spot && (
      <span
        aria-hidden="true"
        style={props.spot}
        className="pointer-events-none absolute rounded-md border-2 border-seal-ink opacity-55 transition-[opacity,box-shadow] duration-200 ease-out-expo group-has-[[data-spot]:hover]/row:opacity-100 group-has-[[data-spot]:hover]/row:shadow-[0_0_0_4px_color-mix(in_oklab,var(--seal)_22%,transparent)] motion-reduce:transition-none"
      />
    )}
  </div>
);
