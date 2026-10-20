/**
 * A ref callback that focuses its element. Being one stable function, React calls it only when
 * the element mounts or when it becomes the element's ref, never on other renders: it moves
 * focus after an update that removed or moved the focused control.
 * @param node The element, or null when it unmounts.
 */
export const focusOnMount = (node: HTMLElement | null) => {
  node?.focus();
};

/**
 * A ref callback that calls `handler` when Escape is pressed inside the element, unless something
 * inside (a calendar popover) took the key first, or it ends an input method's composition (the
 * candidates close, not the form). For a form that closes like its Cancel button; a listener on
 * the element rather than a `keydown` prop, which a form can't carry for the accessibility lint.
 * @param handler Called on Escape.
 * @returns The ref callback, which removes its listener when the element goes.
 */
export const onEscape = (handler: () => void) => (node: HTMLElement | null) => {
  const listen = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.isComposing && !event.defaultPrevented) {
      handler();
    }
  };
  node?.addEventListener('keydown', listen);

  return () => {
    node?.removeEventListener('keydown', listen);
  };
};
