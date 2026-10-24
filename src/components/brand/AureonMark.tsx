/**
 * Aureon's orbit mark: a ring broken at the upper right, with one satellite dot beyond the gap. It
 * draws in `currentColor`: violet on light surfaces, white on the rail. Decorative: the name is
 * always written or labelled beside it.
 * @param props Component props.
 * @param props.className Size and colour.
 * @param props.size Its size in pixels, where no CSS sizes it (the icons and images drawn at build).
 * @returns The mark.
 */
export const AureonMark = (props: { className?: string; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    data-slot="aureon-mark"
    width={props.size}
    height={props.size}
    className={props.className}
  >
    {/* A 290° arc of radius 8 around the centre, open from -80° to -10°; the satellite sits out
        past the orbit, on the gap's bisector, so the mark never reads as a spinner. */}
    <path d="M19.88 10.61A8 8 0 1 1 13.39 4.12" stroke="currentColor" strokeWidth="3" />
    <circle cx="19" cy="5" r="2.75" fill="currentColor" />
  </svg>
);

/**
 * The mark's satellite on its own, the system's "current": the dot at the upper right of the
 * active item in the sidebar and the rail, and of the current stage on a status track, as it sits
 * past the orbit in the mark. Never the only cue (the item is filled, set heavier or named), and
 * decorative. Its parent is `relative`; `className` places and colours it (`currentColor`).
 * @param props Component props.
 * @param props.className Where it sits, and its colour.
 * @returns The dot.
 */
export const Satellite = (props: { className?: string }) => (
  <span
    aria-hidden="true"
    data-satellite=""
    className={`pointer-events-none absolute size-1.5 rounded-full bg-current ${props.className ?? ''}`}
  />
);
