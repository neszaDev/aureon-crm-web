/**
 * The top of a settings page: its title (the page's `h1`), what it is for, and its main action.
 * @param props Component props.
 * @param props.title The title.
 * @param props.description One or two sentences under it.
 * @param props.action Buttons beside the title, such as "Invite member" (side by side).
 * @returns The header.
 */
export const SettingsHeader = (props: {
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-[-0.01em] break-words">{props.title}</h1>
      <p className="max-w-[65ch] text-muted-foreground">{props.description}</p>
    </div>
    {props.action && <div className="flex shrink-0 flex-wrap gap-2">{props.action}</div>}
  </header>
);
