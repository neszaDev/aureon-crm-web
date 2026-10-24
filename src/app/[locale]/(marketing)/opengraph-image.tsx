import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getTranslations } from 'next-intl/server';
import { ImageResponse } from 'next/og';
import { AureonMark } from '@/components/brand/AureonMark';
import { routing } from '@/libs/I18nRouting';
import { AppConfig } from '@/utils/AppConfig';

export const alt = AppConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// One image per language, drawn at build time.
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

// The image renders outside the page's CSS, so the tokens are spelled out (global.css, light).
const VIOLET = '#5a45e0';
const VIOLET_TINT = '#efedfd';
const RULE = '#e6e6ec';
const INK = '#1f2030';
const INK_2 = '#5d6072';
const WHITE = '#ffffff';

// Anuphan Bold, the app's face for Latin and Thai, as a static TTF (the renderer reads no WOFF2),
// beside this file with its licence (Anuphan-OFL.txt): the image is drawn without the network.
// The bundler emits the file for this URL; its `href` (not the URL object, which may come from
// another realm in Next's workers) gives the path.
// oxlint-disable-next-line unicorn/relative-url-style -- the bundler's asset pattern is './'
const ANUPHAN_BOLD = new URL('./Anuphan-Bold.ttf', import.meta.url).href;

/**
 * The words of a Thai line, where it may break: the renderer breaks only at spaces, and Thai has
 * none between words. A word joiner (U+2060) in the copy keeps its two sides on one line.
 * @param text The line.
 * @returns Its words.
 */
const thaiWords = (text: string) => {
  const words: string[] = [];
  for (const { segment } of new Intl.Segmenter('th', { granularity: 'word' }).segment(text)) {
    const last = words.at(-1);
    if (last !== undefined && (last.endsWith('\u2060') || segment.startsWith('\u2060'))) {
      words[words.length - 1] = last + segment;
    } else {
      words.push(segment);
    }
  }

  // The joiner has no glyph in the font: it has done its work.
  return words.map((word) => word.replaceAll('\u2060', ''));
};

/**
 * The shared image of the public pages, per language, as the landing page's band opens: the
 * orbit mark and the name, a deal of the demo workspace as its list row draws it (its stage's
 * pill, its track filled up to it, its owner), and the headline, white on Aureon violet.
 * @param props Route props.
 * @param props.params The locale.
 * @returns The PNG.
 */
export default async function OpenGraphImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Index' });
  const tTrack = await getTranslations({ locale, namespace: 'StatusTrack' });
  const title = t('title');

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 80px 72px',
        background: VIOLET,
        color: WHITE,
        fontFamily: 'Anuphan',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 40 }}>
        <AureonMark size={52} />
        {AppConfig.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* The demo workspace's deal in Proposal, the third of four open stages, for a day. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            alignSelf: 'flex-start',
            padding: '18px 28px',
            borderRadius: 14,
            background: WHITE,
            color: INK,
            fontSize: 26,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 20px',
              borderRadius: 999,
              background: VIOLET_TINT,
              color: VIOLET,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 7, background: VIOLET }} />
            Proposal
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[true, true, true, false].map((filled, step) => (
              <div
                key={step}
                style={{
                  width: 76,
                  height: 10,
                  borderRadius: 5,
                  background: filled ? VIOLET : RULE,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', color: INK_2 }}>{tTrack('days_short', { count: 1 })}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              background: VIOLET,
              color: WHITE,
              fontSize: 18,
            }}
          >
            MR
          </div>
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
            ? thaiWords(title).map((word, index) =>
                // A space between phrases is a box of its own, which the renderer would drop.
                word.trim() ? (
                  <span key={index}>{word}</span>
                ) : (
                  <span key={index} style={{ width: '0.3em' }} />
                ),
              )
            : title}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Anuphan',
          data: await readFile(fileURLToPath(ANUPHAN_BOLD)),
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );
}
