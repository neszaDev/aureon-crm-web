/**
 * The search and filters above a list: a search landmark, its controls in a wrapping row.
 * @param props Component props.
 * @param props.label What the landmark searches, such as "Search companies".
 * @param props.children The controls.
 * @returns The toolbar.
 */
export const ListToolbar = (props: { label: string; children: React.ReactNode }) => (
  <search aria-label={props.label} className="flex flex-wrap items-end gap-3">
    {props.children}
  </search>
);
