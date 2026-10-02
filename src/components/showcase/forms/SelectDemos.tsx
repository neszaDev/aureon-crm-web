'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Combobox } from '@/components/Combobox';
import { Label } from '@/components/ui/label';
import { US_STATES } from './data';

/**
 * The multiselect demo: pick several states as removable chips (American Samoa is disabled).
 * @returns The labelled multiselect.
 */
export const MultiselectDemo = () => {
  const t = useTranslations('AdvancedFormsPage');
  const [states, setStates] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-2">
      <Label id="multiselect-label" htmlFor="multiselect">
        {t('states_label')}
      </Label>
      <Combobox
        id="multiselect"
        labelId="multiselect-label"
        options={US_STATES}
        value={states}
        onValueChange={setStates}
        multiple
        placeholder={t('multiselect_placeholder')}
        searchPlaceholder={t('search_states')}
      />
    </div>
  );
};

/**
 * The searchable select demos: one state, or several in a clearable field.
 * @returns The labelled selects.
 */
export const SelectDemo = () => {
  const t = useTranslations('AdvancedFormsPage');
  const [state, setState] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label id="select-single-label" htmlFor="select-single">
          {t('state_label')}
        </Label>
        <Combobox
          id="select-single"
          labelId="select-single-label"
          options={US_STATES}
          value={state}
          onValueChange={setState}
          clearable
          placeholder={t('select_placeholder')}
          searchPlaceholder={t('search_states')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label id="select-multiple-label" htmlFor="select-multiple">
          {t('states_label')}
        </Label>
        <Combobox
          id="select-multiple"
          labelId="select-multiple-label"
          options={US_STATES}
          value={states}
          onValueChange={setStates}
          multiple
          clearable
          placeholder={t('select_placeholder')}
          searchPlaceholder={t('search_states')}
        />
      </div>
    </div>
  );
};
