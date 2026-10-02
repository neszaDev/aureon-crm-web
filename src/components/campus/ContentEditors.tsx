'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MultiLanguageEditor } from './MultiLanguageEditor';
import { MultiLanguageFields } from './MultiLanguageFields';

/**
 * A switch for a card's header.
 * @param props Component props.
 * @param props.id Id of the switch.
 * @param props.checked Whether it is on.
 * @param props.onCheckedChange Called with the new state.
 * @returns The labelled switch.
 */
const EditableSwitch = (props: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => {
  const t = useTranslations('CampusContent');

  return (
    <div className="flex items-center gap-2">
      <Switch id={props.id} checked={props.checked} onCheckedChange={props.onCheckedChange} />
      <Label htmlFor={props.id}>{t('editable')}</Label>
    </div>
  );
};

/**
 * The two multi-language editors of the campus content page, each with a switch for its add
 * and remove buttons (off by default for plain fields and on for rich text, as in Vue).
 * @returns The two cards.
 */
export const ContentEditors = () => {
  const t = useTranslations('CampusContent');
  const [fieldsEditable, setFieldsEditable] = useState(false);
  const [editorEditable, setEditorEditable] = useState(true);

  return (
    <TooltipProvider>
      <DemoCard
        title={t('fields_title')}
        description={t('fields_description')}
        action={
          <EditableSwitch
            id="fields-editable"
            checked={fieldsEditable}
            onCheckedChange={setFieldsEditable}
          />
        }
      >
        <MultiLanguageFields caption={t('fields_caption')} editable={fieldsEditable} />
      </DemoCard>
      <DemoCard
        title={t('editor_title')}
        description={t('editor_description')}
        action={
          <EditableSwitch
            id="editor-editable"
            checked={editorEditable}
            onCheckedChange={setEditorEditable}
          />
        }
      >
        <MultiLanguageEditor caption={t('editor_caption')} editable={editorEditable} />
      </DemoCard>
    </TooltipProvider>
  );
};
