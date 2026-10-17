/**
 * A ref callback that focuses its element. Being one stable function, React calls it only when
 * the element mounts or when it becomes the element's ref, never on other renders: it moves
 * focus after an update that removed or moved the focused control.
 * @param node The element, or null when it unmounts.
 */
export const focusOnMount = (node: HTMLElement | null) => {
  node?.focus();
};
