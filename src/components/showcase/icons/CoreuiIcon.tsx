import { createElement } from 'react';
import type { SvgNode } from './svgMarkup';
import { parseSvgMarkup, toViewBox } from './svgMarkup';

const renderNodes = (nodes: SvgNode[]): React.ReactNode[] =>
  nodes.map((node, index) =>
    // Static icon data has no ids of its own; position is the identity.
    createElement(node.tag, { key: index, ...node.attrs }, ...renderNodes(node.children)),
  );

/**
 * A decorative `@coreui/icons` brand or flag icon, built as React SVG elements.
 * @param props Component props.
 * @param props.icon The icon entry: `[viewBox, markup]`.
 * @param props.name Unique name on the page; scopes the icon's internal ids.
 * @param props.className Size and colour classes.
 * @returns The SVG.
 */
export const CoreuiIcon = (props: { icon: string[]; name: string; className?: string }) => {
  const [viewBox = '0 0 32 32', markup = ''] = props.icon;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={toViewBox(viewBox)}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={props.className}
    >
      {renderNodes(parseSvgMarkup(markup, props.name))}
    </svg>
  );
};
