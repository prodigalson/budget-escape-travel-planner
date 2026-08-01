/**
 * Departure validation seam.
 *
 * At this stage departure is free text and there is no geocoding or live
 * lookup, so validation simply rejects empty input. The async contract exists
 * so a later issue can drop in a real geocoder without changing the flow: the
 * flow shows a loading state while `validateDeparture` is pending and an error
 * state when it resolves to `{ ok: false }`.
 */
export function validateDeparture(value, { delay = 350 } = {}) {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  return new Promise((resolve) => {
    if (!trimmed) {
      resolve({ ok: false, message: 'Enter your departure city or station.' });
      return;
    }

    setTimeout(() => {
      resolve({ ok: true, normalized: trimmed });
    }, delay);
  });
}
