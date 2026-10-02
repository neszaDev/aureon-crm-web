/**
 * Turns the SVG markup that `@coreui/icons` ships as a string into a small element tree, so
 * icons render as React elements instead of through `dangerouslySetInnerHTML`. Only known SVG
 * shape and paint-server elements and presentation attributes survive; anything else is
 * dropped with its subtree.
 */

const TAGS = [
  'circle',
  'clipPath',
  'defs',
  'ellipse',
  'g',
  'line',
  'linearGradient',
  'mask',
  'path',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'stop',
  'use',
] as const;

type SvgTag = (typeof TAGS)[number];

export type SvgNode = {
  tag: SvgTag;
  attrs: Record<string, string>;
  children: SvgNode[];
};

/** Markup attribute → React prop, for every attribute an icon may carry. */
const ATTRS: Record<string, string> = {
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'xlink:href': 'href',
  cx: 'cx',
  cy: 'cy',
  d: 'd',
  fill: 'fill',
  fx: 'fx',
  fy: 'fy',
  gradientTransform: 'gradientTransform',
  gradientUnits: 'gradientUnits',
  height: 'height',
  href: 'href',
  id: 'id',
  mask: 'mask',
  offset: 'offset',
  opacity: 'opacity',
  points: 'points',
  r: 'r',
  rx: 'rx',
  ry: 'ry',
  stroke: 'stroke',
  transform: 'transform',
  width: 'width',
  x: 'x',
  x1: 'x1',
  x2: 'x2',
  y: 'y',
  y1: 'y1',
  y2: 'y2',
};

const isTag = (name: string): name is SvgTag => TAGS.some((tag) => tag === name);

const TAG_PATTERN = /<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z:-]+=(?:'[^']*'|"[^"]*"))*)\s*(\/?)>/gu;
const ATTR_PATTERN = /([a-zA-Z:-]+)=(?:'([^']*)'|"([^"]*)")/gu;

/**
 * Parses an icon's markup into elements, scoping its ids so many icons can share a page.
 * @param markup The inner SVG markup (the second item of a `@coreui/icons` entry).
 * @param idPrefix Prefix for every `id` and the `#id` references to it.
 * @returns The top-level nodes.
 */
export const parseSvgMarkup = (markup: string, idPrefix: string): SvgNode[] => {
  const scope = (prop: string, value: string) => {
    if (prop === 'id') {
      return `${idPrefix}-${value}`;
    }
    if (prop === 'href') {
      return value.replace(/^#(.+)$/u, `#${idPrefix}-$1`);
    }
    return value.replaceAll(/url\(#([^)]+)\)/gu, `url(#${idPrefix}-$1)`);
  };
  const root: SvgNode[] = [];
  // Open elements; `null` marks a dropped element whose subtree is skipped.
  const stack: (SvgNode | null)[] = [];

  for (const match of markup.matchAll(TAG_PATTERN)) {
    const [, closing, name = '', rawAttrs = '', selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    const parent = stack.at(-1);
    const node: SvgNode | null =
      isTag(name) && parent !== null ? { tag: name, attrs: {}, children: [] } : null;
    if (node) {
      for (const [, key = '', single, double] of rawAttrs.matchAll(ATTR_PATTERN)) {
        const prop = ATTRS[key];
        const value = single ?? double ?? '';
        if (prop) {
          node.attrs[prop] = scope(prop, value);
        }
      }
      (parent ? parent.children : root).push(node);
    }
    if (!selfClosing) {
      stack.push(node);
    }
  }

  return root;
};

/**
 * The full `viewBox` of an icon: `@coreui/icons` stores "width height" for most icons.
 * @param value The first item of a `@coreui/icons` entry.
 * @returns A four-number view box.
 */
export const toViewBox = (value: string) => {
  const parts = value.trim().split(/\s+/u);
  return parts.length === 2 ? `0 0 ${parts.join(' ')}` : parts.join(' ');
};
