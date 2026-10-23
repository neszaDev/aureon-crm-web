/**
 * The search and filters above a list, each with its label over it: a search landmark, its
 * controls in a wrapping row. The lists not yet on `ListToolbar`'s one line use it.
 * @param props Component props.
 * @param props.label What the landmark searches, such as "Search leads".
 * @param props.children The controls.
 * @returns The row.
 */
export const FilterRow = (props: { label: string; children: React.ReactNode }) => (
  <search aria-label={props.label} className="flex flex-wrap items-end gap-3">
    {props.children}
  </search>
);
