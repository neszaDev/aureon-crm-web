import { cibFacebook, cibTwitter } from '@coreui/icons';

const GLYPHS = { facebook: cibFacebook, twitter: cibTwitter };

// CoreUI brand icons are `[viewBox, '<path d="..."/>...']`; only the path data is drawn.
const pathsOf = (svg: string) =>
  [...svg.matchAll(/\sd=['"]([^'"]+)['"]/gu)].map((match) => match[1]);

/**
 * A brand logo from `@coreui/icons` (lucide has no brand icons), drawn in the current text colour.
 * Decorative: label the control that holds it.
 * @param props Component props.
 * @param props.brand Which logo.
 * @param props.className Extra classes, usually a size.
 * @returns The SVG.
 */
export const BrandGlyph = (props: { brand: keyof typeof GLYPHS; className?: string }) => {
  const [viewBox, svg = ''] = GLYPHS[props.brand];

  return (
    <svg
      viewBox={`0 0 ${viewBox}`}
      fill="currentColor"
      aria-hidden="true"
      className={props.className ?? 'size-4'}
    >
      {pathsOf(svg).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};
