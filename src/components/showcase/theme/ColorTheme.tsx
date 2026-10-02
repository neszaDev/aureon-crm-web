import { useTranslations } from 'next-intl';
import type { Swatch } from './palette';
import { contrastLevel, contrastRatio, hexOf, toRgb } from './palette';

/**
 * One palette colour: its swatch (painted from the live CSS token), name, role, hex and RGB
 * values, and its contrast against the colour it is read with.
 * @param props Component props.
 * @param props.swatch The colour.
 * @param props.role What the colour is used for.
 * @returns The colour tile.
 */
export const ColorTheme = (props: { swatch: Swatch; role: React.ReactNode }) => {
  const t = useTranslations('ColorTheme');
  const pairHex = hexOf(props.swatch.pair) ?? props.swatch.hex;
  const ratio = contrastRatio(props.swatch.hex, pairHex);

  return (
    <li className="flex flex-col gap-3">
      <div
        className="flex aspect-4/3 items-end rounded-sm border border-ink-200 p-3"
        style={{ backgroundColor: `var(--${props.swatch.token})` }}
      >
        <span
          aria-hidden="true"
          className="text-xl font-bold"
          style={{ color: `var(--${props.swatch.pair})` }}
        >
          {t('sample')}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-sm font-semibold break-all text-ink-950">
          --{props.swatch.token}
        </h3>
        <p className="text-[0.8125rem] text-ink-600">{props.role}</p>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[0.8125rem]">
        <dt className="text-ink-600">{t('hex')}</dt>
        <dd className="font-semibold text-ink-900 tabular-nums">{props.swatch.hex}</dd>
        <dt className="text-ink-600">{t('rgb')}</dt>
        <dd className="font-semibold text-ink-900 tabular-nums">
          {t('rgb_value', { channels: toRgb(props.swatch.hex).join(', ') })}
        </dd>
        <dt className="text-ink-600">{t('contrast')}</dt>
        <dd className="text-ink-900">
          <span className="font-semibold tabular-nums">{t('ratio', { ratio })}</span>{' '}
          {t('against', { pair: props.swatch.pair, level: contrastLevel(ratio) })}
        </dd>
      </dl>
    </li>
  );
};
