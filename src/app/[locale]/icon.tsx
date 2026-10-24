import { ImageResponse } from 'next/og';
import { AureonMark } from '@/components/brand/AureonMark';
import { routing } from '@/libs/I18nRouting';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// The same icon in every language, drawn at build time.
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/**
 * The browser tab's icon, drawn from the mark at build time: the orbit mark in Aureon violet
 * (global.css, light) on a white tile. `public/favicon.ico` holds the same image
 * (`pnpm favicon`).
 * @returns The PNG.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        borderRadius: 7,
        background: '#ffffff',
        color: '#5a45e0',
      }}
    >
      <AureonMark size={28} />
    </div>,
    size,
  );
}
