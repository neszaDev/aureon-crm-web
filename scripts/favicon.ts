// Writes public/favicon.ico (`pnpm favicon`), the icon of clients that ask for /favicon.ico
// without reading a page, from the 32 px icon the app draws from its mark at build
// (src/app/[locale]/icon.tsx): an ICO holding that one PNG. Run it against a production build
// whenever the mark changes:
//
//   BACKEND_URL=http://localhost:8081 APP_URL=http://localhost:3105 pnpm exec next start -p 3105
//   APP_URL=http://localhost:3105 pnpm favicon
import { writeFileSync } from 'node:fs';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3105';
const SIZE = 32;

const page = await fetch(APP_URL);
const html = await page.text();
const href = /<link rel="icon" href="([^"]+)"/u.exec(html)?.[1];
if (!href) {
  throw new Error(`No icon on ${APP_URL}`);
}
const response = await fetch(new URL(href, APP_URL));
if (response.headers.get('content-type') !== 'image/png') {
  throw new Error(`${href} is not a PNG`);
}
const png = new Uint8Array(await response.arrayBuffer());

// The ICO's header and its one entry: an icon of one image, 32 × 32 at 32 bits per pixel, the PNG
// right after them.
const header = new DataView(new ArrayBuffer(22));
header.setUint16(2, 1, true);
header.setUint16(4, 1, true);
header.setUint8(6, SIZE);
header.setUint8(7, SIZE);
header.setUint16(10, 1, true);
header.setUint16(12, 32, true);
header.setUint32(14, png.byteLength, true);
header.setUint32(18, header.byteLength, true);
writeFileSync('public/favicon.ico', Buffer.concat([new Uint8Array(header.buffer), png]));
console.log(`wrote public/favicon.ico from ${href}`);
