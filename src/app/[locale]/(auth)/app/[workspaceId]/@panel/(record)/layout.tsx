import { RecordPanel } from '@/components/crm/record/RecordPanel';

/**
 * The frame of a record opened from inside the workspace: the panel stays while its record
 * loads, and while one record leads to another.
 * @param props Layout props.
 * @param props.children The record's page, or its skeleton while it loads.
 * @returns The panel.
 */
export default function RecordPanelLayout(props: { children: React.ReactNode }) {
  return <RecordPanel>{props.children}</RecordPanel>;
}
