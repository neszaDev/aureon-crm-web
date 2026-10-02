/** Where a popover or tooltip sits around its trigger, in the order the Vue demos list them. */
export const PLACEMENTS = [
  { side: 'top', align: 'start' },
  { side: 'top', align: 'center' },
  { side: 'top', align: 'end' },
  { side: 'bottom', align: 'start' },
  { side: 'bottom', align: 'center' },
  { side: 'bottom', align: 'end' },
  { side: 'right', align: 'start' },
  { side: 'right', align: 'center' },
  { side: 'right', align: 'end' },
  { side: 'left', align: 'start' },
  { side: 'left', align: 'center' },
  { side: 'left', align: 'end' },
] as const;

export type Placement = (typeof PLACEMENTS)[number];
