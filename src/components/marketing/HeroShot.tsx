import type { StaticImageData } from 'next/image';
import { getImageProps } from 'next/image';

type Pair = { wide: StaticImageData; narrow: StaticImageData };

// The sheet is the page column wide: the app at 1440 px from 768 px, a phone's board below.
const WIDE_SIZES = '(min-width: 1280px) 1216px, calc(100vw - 3.5rem)';
const NARROW_SIZES = 'calc(100vw - 2rem)';
const WIDE = '(min-width: 768px)';
const DARK = '(prefers-color-scheme: dark)';

/**
 * The captures as one `<picture>`, so the browser fetches only the one it shows: the wide one from
 * 768 px, the phone one below, `dark` under the system's dark scheme and `light` otherwise.
 * @param props Component props.
 * @param props.light The captures for a light system scheme.
 * @param props.dark The captures for a dark system scheme.
 * @param props.alt What they show.
 * @param props.eager Loads at once with high priority, as the page's largest paint; otherwise
 *   lazily, so it loads only once shown.
 * @param props.className Classes for the image: whether it shows.
 * @returns The picture.
 */
const Capture = (props: {
  light: Pair;
  dark: Pair;
  alt: string;
  eager: boolean;
  className: string;
}) => {
  const image = (src: StaticImageData, sizes: string) =>
    getImageProps({
      src,
      alt: props.alt,
      sizes,
      loading: props.eager ? 'eager' : 'lazy',
      fetchPriority: props.eager ? 'high' : undefined,
    }).props;
  const narrow = image(props.light.narrow, NARROW_SIZES);

  return (
    <picture>
      <source
        media={`${WIDE} and ${DARK}`}
        srcSet={image(props.dark.wide, WIDE_SIZES).srcSet}
        sizes={WIDE_SIZES}
      />
      <source media={WIDE} srcSet={image(props.light.wide, WIDE_SIZES).srcSet} sizes={WIDE_SIZES} />
      <source
        media={DARK}
        srcSet={image(props.dark.narrow, NARROW_SIZES).srcSet}
        sizes={NARROW_SIZES}
      />
      {/* getImageProps is next/image's own art-direction API: it gives a plain <img>. */}
      <img
        {...narrow}
        src={narrow.src}
        alt={props.alt}
        // On the img, not the picture: Chrome loads a lazy img hidden only by its parent.
        className={`size-full object-cover object-left-top ${props.className}`}
      />
    </picture>
  );
};

/**
 * The hero's capture of the deals board in the app, laid as a sheet across the band's lower edge
 * (cropped to its top on a phone), in the theme the page shows. The first picture follows the system's colour scheme
 * and loads at once (one image, the page's largest paint). When a theme chosen in the app
 * contradicts the system, its mirror shows instead, and only then loads.
 * @param props Component props.
 * @param props.light The light captures.
 * @param props.dark The dark captures.
 * @param props.alt What they show.
 * @returns The sheet.
 */
export const HeroShot = (props: { light: Pair; dark: Pair; alt: string }) => (
  <div className="h-[26rem] overflow-hidden rounded-lg border border-rule bg-paper shadow-overlay md:aspect-[16/9] md:h-auto">
    <Capture
      light={props.light}
      dark={props.dark}
      alt={props.alt}
      eager
      className="block [@media(prefers-color-scheme:dark)]:[.light_&]:hidden [@media(prefers-color-scheme:light)]:[.dark_&]:hidden"
    />
    <Capture
      light={props.dark}
      dark={props.light}
      alt={props.alt}
      eager={false}
      className="hidden [@media(prefers-color-scheme:dark)]:[.light_&]:block [@media(prefers-color-scheme:light)]:[.dark_&]:block"
    />
  </div>
);
