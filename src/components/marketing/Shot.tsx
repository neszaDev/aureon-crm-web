import { cn } from 'cn';
import type { StaticImageData } from 'next/image';
import { getImageProps } from 'next/image';

/**
 * A spot on a capture, in percent of the image, that its section's developer note rings: drawn
 * at rest, ringed fully while the note is hovered.
 */
export type Spot = { left: string; top: string; width: string; height: string };

type Pair = { light: StaticImageData; dark: StaticImageData };

const NARROW = '(max-width: 767px)';
// Below 768 px a crop fills the column, 16 px from each edge.
const NARROW_SIZES = 'calc(100vw - 2rem)';

/**
 * One theme's capture: the wide one, or below 768 px the narrow crop around the part the
 * section is about, as a `<picture>` so the browser fetches only the one it shows.
 * @param props Component props.
 * @param props.wide The wide capture.
 * @param props.narrow The narrow crop.
 * @param props.alt What it shows.
 * @param props.sizes The wide capture's displayed width.
 * @param props.className Classes for the image: whether it shows.
 * @returns The picture.
 */
const Capture = (props: {
  wide: StaticImageData;
  narrow?: StaticImageData;
  alt: string;
  sizes: string;
  className: string;
}) => {
  const wide = getImageProps({ src: props.wide, alt: props.alt, sizes: props.sizes }).props;
  const narrow =
    props.narrow && getImageProps({ src: props.narrow, alt: props.alt, sizes: NARROW_SIZES }).props;

  return (
    <picture>
      {narrow && (
        <source
          media={NARROW}
          srcSet={narrow.srcSet}
          sizes={NARROW_SIZES}
          width={narrow.width}
          height={narrow.height}
        />
      )}
      {/* getImageProps is next/image's own art-direction API: it gives a plain <img>. */}
      <img
        {...wide}
        src={wide.src}
        alt={props.alt}
        className={`h-auto w-full ${props.className}`}
      />
    </picture>
  );
};

/**
 * A real capture of the app on a panel: the light capture, or the dark one under the dark theme (the other is `display: none` and, lazy, waits); with `narrow`, a crop around the
 * section's part below 768 px, where the whole screen would be too small to read.
 * @param props Component props.
 * @param props.light The light capture.
 * @param props.dark The dark capture.
 * @param props.narrow The light and dark crops for phones.
 * @param props.alt What the capture shows.
 * @param props.sizes The displayed width, for the image optimiser.
 * @param props.spot The part of the capture the section's note is about (the crop is that part).
 * @param props.className Extra classes for the sheet.
 * @returns The sheet.
 */
export const Shot = (props: {
  light: StaticImageData;
  dark: StaticImageData;
  narrow?: Pair;
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
    <Capture
      wide={props.light}
      narrow={props.narrow?.light}
      alt={props.alt}
      sizes={props.sizes}
      className="block dark:hidden"
    />
    <Capture
      wide={props.dark}
      narrow={props.narrow?.dark}
      alt={props.alt}
      sizes={props.sizes}
      className="hidden dark:block"
    />
    {props.spot && (
      <span
        aria-hidden="true"
        style={props.spot}
        className={cn(
          'pointer-events-none absolute rounded-md border-2 border-violet-ink opacity-55 transition-[opacity,box-shadow] duration-200 ease-out-expo group-has-[[data-spot]:hover]/row:opacity-100 group-has-[[data-spot]:hover]/row:shadow-[0_0_0_4px_color-mix(in_oklab,var(--violet)_22%,transparent)] motion-reduce:transition-none',
          props.narrow && 'max-md:hidden',
        )}
      />
    )}
  </div>
);
