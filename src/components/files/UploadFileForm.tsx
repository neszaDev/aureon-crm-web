'use client';

import { LoaderCircleIcon, UploadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { uploadFile } from '@/actions/FileActions';
import { FormAlert } from '@/components/FormAlert';
import { describedBy } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FILE_INPUT_ACCEPT, MAX_FILE_BYTES } from '@/validations/FileValidation';

/**
 * Uploads one file. Size is checked here first; the backend checks size, type and content.
 * @returns The upload form.
 */
export const UploadFileForm = () => {
  const t = useTranslations('FilesPage');
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [uploaded, setUploaded] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setError(undefined);
        setUploaded(undefined);
        const file = input.current?.files?.[0];
        if (!file) {
          setError(t('error_empty'));
          return;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(t('error_too_large'));
          return;
        }

        setSubmitting(true);
        const form = new FormData();
        form.append('file', file);
        const result = await uploadFile(form);
        setSubmitting(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (input.current) {
          input.current.value = '';
        }
        setUploaded(file.name);
      }}
    >
      {error && <FormAlert>{error}</FormAlert>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">{t('file_label')}</Label>
        <Input
          ref={input}
          id="file"
          name="file"
          type="file"
          accept={FILE_INPUT_ACCEPT}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy('file')}
        />
        <p id={describedBy('file')} className="text-xs text-ink-600">
          {t('file_hint')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <UploadIcon data-icon="inline-start" />
          )}
          {t('upload_button')}
        </Button>
        <output className="text-sm font-medium text-pass">
          {uploaded && t('uploaded', { name: uploaded })}
        </output>
      </div>
    </form>
  );
};
