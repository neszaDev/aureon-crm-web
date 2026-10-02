import { cn } from 'cn';

/**
 * The button row closing a demo form, ruled off from the fields like a card footer.
 * @param props Component props.
 * @param props.className Extra classes.
 * @param props.children The buttons.
 * @returns The action row.
 */
export const FormActions = (props: { className?: string; children: React.ReactNode }) => (
  <div
    className={cn(
      '-mx-5 mt-1 flex flex-wrap items-center gap-2 border-t border-ink-200 px-5 pt-4',
      props.className,
    )}
  >
    {props.children}
  </div>
);
