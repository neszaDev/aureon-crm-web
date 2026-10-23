/**
 * A ref callback that focuses its element. Being one stable function, React calls it only when
 * the element mounts or when it becomes the element's ref, never on other renders: it moves
 * focus after an update that removed or moved the focused control.
 * @param node The element, or null when it unmounts.
 */
export const focusOnMount = (node: HTMLElement | null) => {
  node?.focus();
};

// Escapes a record panel left to the form they were pressed in: the panel takes Escape on the
// document before the form sees it, and stays open only by preventing it.
const formEscapes = new WeakSet<Event>();

/**
 * Keeps Escape from closing the dialog it was pressed in (a record panel), and leaves it to the
 * form it was pressed in (`onEscape`) all the same.
 * @param event The key's event, which the dialog saw first.
 */
export const leaveEscapeToForm = (event: KeyboardEvent) => {
  formEscapes.add(event);
  event.preventDefault();
};

/**
 * A ref callback that calls `handler` when Escape is pressed inside the element, unless something
 * inside (a calendar popover) took the key first (a record panel around it only lets it by,
 * `leaveEscapeToForm`), or it ends an input method's composition (the candidates close, not the
 * form). For a form that closes like its Cancel button; a listener on the element rather than a
 * `keydown` prop, which a form can't carry for the accessibility lint. The element is marked
 * (`data-escape`), so a record panel around it knows the key is the element's.
 * @param handler Called on Escape.
 * @returns The ref callback, which removes its listener when the element goes.
 */
export const onEscape = (handler: () => void) => (node: HTMLElement | null) => {
  if (node) {
    node.dataset.escape = '';
  }
  const listen = (event: KeyboardEvent) => {
    if (
      event.key === 'Escape' &&
      !event.isComposing &&
      (!event.defaultPrevented || formEscapes.has(event))
    ) {
      handler();
    }
  };
  node?.addEventListener('keydown', listen);

  return () => {
    node?.removeEventListener('keydown', listen);
  };
};
