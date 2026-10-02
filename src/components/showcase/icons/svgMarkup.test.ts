import { cibFacebook, cifFr } from '@coreui/icons';
import { describe, expect, it } from 'vitest';
import { parseSvgMarkup, toViewBox } from './svgMarkup';

describe(parseSvgMarkup, () => {
  it('reads the paths of a brand icon', () => {
    const nodes = parseSvgMarkup(cibFacebook[1] ?? '', 'facebook');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.tag).toBe('path');
    expect(nodes[0]?.attrs.d).toMatch(/^M32 16c/u);
  });

  it('keeps nesting and fills of a flag', () => {
    const [group] = parseSvgMarkup(cifFr[1] ?? '', 'cif-fr');

    expect(group?.tag).toBe('g');
    expect(group?.children.map((child) => child.attrs.fill)).toStrictEqual([
      '#ed2939',
      '#fff',
      '#002395',
    ]);
  });

  it('scopes ids and the references to them', () => {
    const [defs, shape, use] = parseSvgMarkup(
      "<defs><linearGradient id='a'><stop stop-color='#fff' offset='0'/></linearGradient></defs><path fill='url(#a)' clip-path='url(#a)' d='M0 0h1v1z'/><use xlink:href='#a'/>",
      'flag',
    );

    expect(defs?.children[0]?.attrs.id).toBe('flag-a');
    expect(defs?.children[0]?.children[0]?.attrs).toStrictEqual({ stopColor: '#fff', offset: '0' });
    expect(shape?.attrs).toMatchObject({ fill: 'url(#flag-a)', clipPath: 'url(#flag-a)' });
    expect(use?.attrs.href).toBe('#flag-a');
  });

  it('drops unknown elements with their subtree and unknown attributes', () => {
    const nodes = parseSvgMarkup(
      "<script><path d='M0 0'/></script><foreignObject><div/></foreignObject><path d='M1 1' onclick='x()' style='a'/>",
      'icon',
    );

    expect(nodes).toStrictEqual([{ tag: 'path', attrs: { d: 'M1 1' }, children: [] }]);
  });
});

describe(toViewBox, () => {
  it('prefixes the origin to a width and height', () => {
    expect(toViewBox('32 32')).toBe('0 0 32 32');
  });

  it('keeps a full view box', () => {
    expect(toViewBox('0 0 301 201')).toBe('0 0 301 201');
  });
});
