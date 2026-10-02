'use client';

import { SaveIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const SAVE_MS = 2000;

/**
 * A button that shows a spinner and stays disabled while its (simulated) work runs.
 * @returns The button.
 */
export const LoadingButtonDemo = () => {
  const t = useTranslations('LoadingButtonDemo');
  const [saving, setSaving] = useState(false);

  return (
    <Button
      disabled={saving}
      aria-busy={saving}
      onClick={() => {
        setSaving(true);
        window.setTimeout(() => {
          setSaving(false);
        }, SAVE_MS);
      }}
    >
      {saving ? (
        <Spinner data-icon="inline-start" aria-hidden />
      ) : (
        <SaveIcon data-icon="inline-start" />
      )}
      {saving ? t('saving') : t('save')}
    </Button>
  );
};
