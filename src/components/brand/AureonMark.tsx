/**
 * Aureon's orbit mark: a ring broken at the upper right, with one satellite dot beyond the gap. It
 * draws in `currentColor`: violet on light grounds, white on the rail. Decorative: the name is
 * always written or labelled beside it.
 * @param props Component props.
 * @param props.className Size and colour.
 * @returns The mark.
 */
export const AureonMark = (props: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    data-slot="aureon-mark"
    className={props.className}
  >
    {/* A 290° arc of radius 8 around the centre, open from -80° to -10°; the satellite sits out
        past the orbit, on the gap's bisector, so the mark never reads as a spinner. */}
    <path d="M19.88 10.61A8 8 0 1 1 13.39 4.12" stroke="currentColor" strokeWidth="3" />
    <circle cx="19" cy="5" r="2.75" fill="currentColor" />
  </svg>
);
