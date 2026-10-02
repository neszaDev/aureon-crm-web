import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DefaultSwitches, RadioSwitches, SwitchRow } from '@/components/showcase/base/SwitchDemos';
import type { SwitchShape, SwitchVariant } from '@/components/showcase/base/ToneSwitch';
import { ToneSwitch } from '@/components/showcase/base/ToneSwitch';
import { DemoCard } from '@/components/showcase/DemoCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// The Vue cards after the first two, in order: each repeats the tone row in one style.
type RowId =
  | 'pills'
  | '3d'
  | '3d_disabled'
  | '3d_label'
  | 'outline'
  | 'outline_pill'
  | 'opposite'
  | 'opposite_pill'
  | 'label'
  | 'label_pill'
  | 'label_outline'
  | 'label_outline_pill'
  | 'label_opposite'
  | 'label_opposite_pill';

const ROWS: {
  id: RowId;
  variant?: SwitchVariant;
  shape?: SwitchShape;
  labels?: 'icons' | 'text-first';
  disabled?: boolean;
}[] = [
  { id: 'pills', shape: 'pill' },
  { id: '3d', variant: '3d' },
  { id: '3d_disabled', variant: '3d', disabled: true },
  { id: '3d_label', variant: '3d', labels: 'icons' },
  { id: 'outline', variant: 'outline' },
  { id: 'outline_pill', variant: 'outline', shape: 'pill' },
  { id: 'opposite', variant: 'opposite' },
  { id: 'opposite_pill', variant: 'opposite', shape: 'pill' },
  { id: 'label', labels: 'icons' },
  { id: 'label_pill', shape: 'pill', labels: 'icons' },
  { id: 'label_outline', variant: 'outline', labels: 'icons' },
  { id: 'label_outline_pill', variant: 'outline', shape: 'pill', labels: 'icons' },
  { id: 'label_opposite', variant: 'opposite', labels: 'icons' },
  { id: 'label_opposite_pill', variant: 'opposite', shape: 'pill', labels: 'text-first' },
];

const SIZES = [
  { id: 'lg', size: 'lg' },
  { id: 'default', size: 'default' },
  { id: 'sm', size: 'sm' },
] as const;

export default async function SwitchesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SwitchesPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-6 md:grid-cols-2">
        <RadioSwitches />
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <DefaultSwitches />
        {ROWS.map((row) => (
          <DemoCard key={row.id} title={t(`row_${row.id}`)}>
            <SwitchRow
              variant={row.variant}
              shape={row.shape}
              labels={row.labels}
              disabled={row.disabled}
            />
          </DemoCard>
        ))}
      </div>

      <DemoCard title={t('sizes_title')} contentClassName="px-2 pt-2 sm:px-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sizes_size')}</TableHead>
              <TableHead>{t('sizes_example')}</TableHead>
              <TableHead>{t('sizes_prop')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SIZES.map((row) => (
              <TableRow key={row.id} className="even:bg-ink-100/40">
                <TableCell className="font-semibold text-ink-950">{t(`size_${row.id}`)}</TableCell>
                <TableCell>
                  <ToneSwitch
                    tone="folder"
                    variant="3d"
                    size={row.size}
                    defaultChecked
                    label={t(`size_${row.id}`)}
                  />
                </TableCell>
                <TableCell className="text-ink-700">
                  {t.rich(`size_prop_${row.id}`, {
                    code: (chunks) => (
                      <code className="rounded-sm bg-ink-100 px-1.5 py-0.5 font-mono text-[0.8125rem] text-ink-950">
                        {chunks}
                      </code>
                    ),
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DemoCard>
    </>
  );
}
