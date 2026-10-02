'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Badge } from '@/components/ui/badge';
import type { Tone } from './tones';
import { TONES, toneSolid } from './tones';
import type { SwitchShape, SwitchVariant } from './ToneSwitch';
import { ToneSwitch } from './ToneSwitch';

const ROW = 'flex flex-wrap items-center gap-3';

// The Vue "labelIcon" pair: a tick for on, a cross for off.
const ICON_ON = <CheckIcon strokeWidth={3} />;
const ICON_OFF = <XIcon strokeWidth={3} />;

/**
 * One switch per tone, all checked, then a disabled unchecked one: the row every Vue switch
 * card repeats with a different variant.
 * @param props Component props.
 * @param props.variant How the checked state is drawn.
 * @param props.shape Corner shape.
 * @param props.labels On/off labels inside the track: none, icons, or icons with the first
 * switch spelling yes/no.
 * @param props.disabled Disables the tone switches too (the last one always is).
 * @returns The row of switches.
 */
export const SwitchRow = (props: {
  variant?: SwitchVariant;
  shape?: SwitchShape;
  labels?: 'icons' | 'text-first';
  disabled?: boolean;
}) => {
  const t = useTranslations('SwitchesPage');
  const tTone = useTranslations('BaseTones');

  const labelsFor = (index: number) => {
    if (!props.labels) {
      return {};
    }
    if (props.labels === 'text-first' && index === 0) {
      return { labelOn: t('label_yes'), labelOff: t('label_no') };
    }
    return { labelOn: ICON_ON, labelOff: ICON_OFF };
  };

  return (
    <div className={ROW}>
      {TONES.map((tone, index) => (
        <ToneSwitch
          key={tone}
          tone={tone}
          variant={props.variant}
          shape={props.shape}
          defaultChecked
          disabled={props.disabled}
          label={tTone(tone)}
          {...labelsFor(index)}
        />
      ))}
      <ToneSwitch
        tone="folder"
        variant={props.variant}
        shape={props.shape}
        disabled
        label={t('disabled_switch')}
        {...labelsFor(TONES.length)}
      />
    </div>
  );
};

// The radio demo lists the tones in the Vue order, where warning comes before success.
const RADIO_TONES: Tone[] = ['folder', 'ink', 'pencil', 'pass', 'deep', 'pen', 'light', 'dark'];

/**
 * 3D switches that behave as one radio group: turning one on turns the others off, and the
 * badge in the header names the chosen tone.
 * @returns The card.
 */
export const RadioSwitches = () => {
  const t = useTranslations('SwitchesPage');
  const tTone = useTranslations('BaseTones');
  const [chosen, setChosen] = useState<Tone>('pencil');

  return (
    <DemoCard
      title={t('radio_title')}
      description={t('radio_description')}
      action={<Badge className={toneSolid[chosen]}>{tTone(chosen)}</Badge>}
    >
      <div role="radiogroup" aria-label={t('radio_title')} className={ROW}>
        {RADIO_TONES.map((tone) => (
          <ToneSwitch
            key={tone}
            asRadio
            tone={tone}
            variant="3d"
            name="radio-switch"
            value={tone}
            checked={chosen === tone}
            onCheckedChange={(checked) => {
              if (checked) {
                setChosen(tone);
              }
            }}
            labelOn={ICON_ON}
            labelOff={ICON_OFF}
            label={tTone(tone)}
          />
        ))}
      </div>
    </DemoCard>
  );
};

/**
 * The default switches: the first one is bound to the badge in the header, the rest show every
 * tone checked, and the last is disabled.
 * @returns The card.
 */
export const DefaultSwitches = () => {
  const t = useTranslations('SwitchesPage');
  const tTone = useTranslations('BaseTones');
  const [on, setOn] = useState(true);

  return (
    <DemoCard
      title={t('default_title')}
      description={t('default_description')}
      action={<Badge>{on ? t('state_on') : t('state_off')}</Badge>}
    >
      <div className={ROW}>
        <ToneSwitch
          tone="folder"
          name="switch1"
          checked={on}
          onCheckedChange={setOn}
          label={tTone('folder')}
        />
        {TONES.slice(1).map((tone) => (
          <ToneSwitch key={tone} tone={tone} defaultChecked label={tTone(tone)} />
        ))}
        <ToneSwitch tone="folder" disabled label={t('disabled_switch')} />
      </div>
    </DemoCard>
  );
};
