/**
 * Text of an app tile's notification badge: nothing for zero, the count up to 99, then "99+".
 * @param count Unread notifications.
 * @returns The badge text, or `null` when there is no badge.
 */
export const badgeLabel = (count: number) => {
  if (count <= 0) {
    return null;
  }

  return count > 99 ? '99+' : String(count);
};

/**
 * File name of a downloaded QR code, built from its label.
 * @param label The label printed under the code.
 * @returns A file name such as `qr-code-mfu.png`.
 */
export const qrFileName = (label: string) => {
  const slug = label
    .normalize('NFKD')
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '');

  return slug ? `qr-code-${slug}.png` : 'qr-code.png';
};
