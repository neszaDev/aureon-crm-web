import { getTranslations } from 'next-intl/server';
import { ImageResponse } from 'next/og';
import { routing } from '@/libs/I18nRouting';
import { AppConfig } from '@/utils/AppConfig';

export const alt = AppConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// One image per language, drawn at build time.
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

// The image renders outside the page's CSS, so the tokens are spelled out (DESIGN.md, light).
const SEAL = '#c8361c';
const ON_SEAL = '#fff4f0';
const SEAL_INK = '#b8321a';
const SEAL_TINT = '#f6e3dc';
const INK = '#1c1d21';

/**
 * Anuphan, the app's face for Latin and Thai, bold, cut to the glyphs the image draws. Google
 * Fonts serves it as TTF to a plain fetch; the image renderer reads no WOFF2.
 * shortcut: fetched while the image is built (at `next build`), as next/font/google is; bundle a
 * TTF instead if builds must run offline.
 * @param text Every character the image draws.
 * @returns The font file.
 */
const anuphanBold = async (text: string) => {
  const query = `family=Anuphan:wght@700&text=${encodeURIComponent(text)}`;
  const stylesheet = await fetch(`https://fonts.googleapis.com/css2?${query}`);
  const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/u.exec(
    await stylesheet.text(),
  )?.[1];
  if (!url) {
    throw new Error('Anuphan was not found for the Open Graph image');
  }
  const font = await fetch(url);

  return await font.arrayBuffer();
};

const box = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 72,
  height: 72,
};

/**
 * The shared image of the public pages, per language: the wordmark, a stamp row and the headline
 * on the seal, as the landing page's band opens.
 * @param props Route props.
 * @param props.params The locale.
 * @returns The PNG.
 */
export default async function OpenGraphImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Index' });
  const tStamp = await getTranslations({ locale, namespace: 'StampRow' });
  const title = t('title');
  const days = tStamp('days_short', { count: 8 });
  const seals = ['RR', 'MM', 'AO'];

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 80px 72px',
        background: SEAL,
        color: ON_SEAL,
        fontFamily: 'Anuphan',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 40 }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={ON_SEAL}>
          <g transform="rotate(-8 12 12)" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10.25" strokeWidth="2" />
            <circle cx="12" cy="12" r="7.75" strokeWidth="0.75" />
            <path d="M8.9 15.6 12 7.6l3.1 8M10 12.9h4" strokeWidth="1.9" />
          </g>
        </svg>
        {AppConfig.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {seals.map((seal) => (
            <div
              key={seal}
              style={{
                ...box,
                background: SEAL_TINT,
                borderRadius: 6,
                border: `2px solid ${SEAL_INK}66`,
              }}
            >
              <div
                style={{
                  ...box,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  border: `3px solid ${SEAL_INK}`,
                  color: SEAL_INK,
                  fontSize: 22,
                  transform: 'rotate(-8deg)',
                }}
              >
                {seal}
              </div>
            </div>
          ))}
          <div
            style={{
              ...box,
              background: '#ffffff',
              borderRadius: 6,
              border: `4px solid ${INK}`,
              color: SEAL_INK,
              fontSize: 22,
            }}
          >
            {days}
          </div>
          <div
            style={{
              ...box,
              background: '#ffffff',
              borderRadius: 6,
              border: `2px solid ${SEAL_INK}66`,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 1040,
            fontSize: locale === 'th' ? 72 : 84,
            lineHeight: locale === 'th' ? 1.35 : 1.04,
            letterSpacing: locale === 'th' ? 0 : '-0.03em',
          }}
        >
          {/* The renderer breaks lines only at spaces, and Thai has none between words: lay
              out its words as the boxes of a wrapping row instead. */}
          {locale === 'th'
            ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(title)].map((word) => (
                <span key={word.index}>{word.segment}</span>
              ))
            : title}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Anuphan',
          data: await anuphanBold(`${AppConfig.name}${title}${days}${seals.join('')}`),
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );
}
