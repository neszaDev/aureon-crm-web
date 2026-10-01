import { cn } from 'cn';
import type { CSSProperties } from 'react';
import type { TestStatus } from '@/validations/TestResultValidation';

// Hand-drawn marks: a tick for passed, a pen circle for failed, a pencil box for pending.
// Every stroke uses pathLength="1" so `.mark-draw` can draw it on like a pen.
const STROKES: Record<TestStatus, { className: string; width: number; d: string }> = {
  PASSED: {
    className: 'text-pass',
    width: 2.6,
    d: 'M3.4 13.2c1.9 1.5 3.6 3.6 5 6.3C11.2 12.6 15.4 7.2 20.8 3.6',
  },
  FAILED: {
    className: 'text-pen',
    width: 2.2,
    d: 'M13.4 3.3C7.4 2.6 3 6.6 3.1 12.1c.1 5.4 4.2 8.9 9.2 8.7 5.3-.2 8.7-4.1 8.5-9.1-.2-4.8-3.8-8.1-8.9-8.2-1.5 0-2.8.3-3.9.9',
  },
  PENDING: {
    className: 'text-pencil',
    width: 1.8,
    d: 'M5.1 5.3 18.9 4.9l.3 14-14.3.3-.1-13.8',
  },
};

type MarkProps = {
  status: TestStatus;
  className?: string;
  /** Draw the stroke on when it mounts. */
  animate?: boolean;
  /** Delay before drawing, in milliseconds. */
  delay?: number;
  /** Draw the stroke on as it scrolls into view. */
  drawOnView?: boolean;
};

/**
 * The mark for a test status. Decorative: pair it with the status text.
 * @param props Component props.
 * @param props.status Test status the mark stands for.
 * @param props.className Extra classes, usually a size.
 * @param props.animate Draw the stroke on when it mounts.
 * @param props.delay Delay before drawing, in milliseconds.
 * @param props.drawOnView Draw the stroke on as it scrolls into view.
 * @returns The mark as an inline SVG.
 */
export const Mark = (props: MarkProps) => {
  const stroke = STROKES[props.status];
  const style: CSSProperties & { '--mark-delay': number } = { '--mark-delay': props.delay ?? 0 };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-status={props.status}
      className={cn(
        'size-5 shrink-0',
        stroke.className,
        props.animate && 'mark-draw',
        props.drawOnView && 'mark-draw-view',
        props.className,
      )}
      style={style}
    >
      <path
        d={stroke.d}
        pathLength={1}
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
