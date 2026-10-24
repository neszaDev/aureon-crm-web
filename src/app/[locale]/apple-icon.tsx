import { ImageResponse } from 'next/og';
import { AureonMark } from '@/components/brand/AureonMark';
import { routing } from '@/libs/I18nRouting';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// The same icon in every language, drawn at build time.
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/**
 * The home screen's icon, drawn from the mark at build time: the orbit mark in white on an
 * Aureon violet square (global.css), which the device rounds itself.
 * @returns The PNG.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#5a45e0',
        color: '#ffffff',
      }}
    >
      <AureonMark size={112} />
    </div>,
    size,
  );
}
