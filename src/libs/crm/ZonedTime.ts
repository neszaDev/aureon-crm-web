const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/**
 * The UTC offset of a time zone at an instant.
 * @param time The instant, in milliseconds.
 * @param timeZone An IANA time zone.
 * @returns The offset in milliseconds (`+07:00` is 7 hours).
 */
const offsetAt = (time: number, timeZone: string) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(time)
    .find((part) => part.type === 'timeZoneName')?.value;
  // `GMT+07:00`, `GMT-03:30`, or `GMT` at offset zero.
  const [, sign, hours, minutes] = /GMT([+-])(\d{2}):(\d{2})/u.exec(name ?? '') ?? [];
  const offset = (Number(hours ?? 0) * 60 + Number(minutes ?? 0)) * MINUTE;

  return sign === '-' ? -offset : offset;
};

/**
 * Reads a local date and time (a `datetime-local` value) in a time zone.
 * @param local `YYYY-MM-DDTHH:mm`.
 * @param timeZone The workspace's time zone.
 * @returns The ISO 8601 instant in UTC. A time the clocks skip moves forward by the gap; a time
 *   they repeat is the earlier one.
 */
export const toInstant = (local: string, timeZone: string) => {
  // The wall time as if it were UTC, then shifted by the offsets on either side of a change.
  const wall = Date.parse(`${local}:00Z`);
  const before = wall - offsetAt(wall - DAY, timeZone);
  const after = wall - offsetAt(wall + DAY, timeZone);
  // A candidate is right when the zone shows the wall time at it: both are in a repeated hour,
  // neither in a skipped one, where `before` lands after the gap, moved forward by it.
  const exact = [before, after].filter((time) => time + offsetAt(time, timeZone) === wall);

  return new Date(exact.length > 0 ? Math.min(...exact) : before).toISOString();
};

/**
 * Shows an instant as a local date and time in a time zone, for a `datetime-local` input.
 * @param instant An ISO 8601 instant.
 * @param timeZone The workspace's time zone.
 * @returns `YYYY-MM-DDTHH:mm`.
 */
export const toLocalInput = (instant: string, timeZone: string) => {
  const time = Date.parse(instant);

  return new Date(time + offsetAt(time, timeZone)).toISOString().slice(0, 16);
};
