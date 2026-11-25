export const DISPLAY_NAME_MAX = 60;

export type DisplayNameResult = { ok: true; value: string } | { ok: false; error: string };

/** Pure: trims and collapses whitespace, then checks length (matches the DB check constraint). */
export function validateDisplayName(input: string): DisplayNameResult {
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length === 0) return { ok: false, error: 'Please enter your name' };
  if (value.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: `Keep it under ${DISPLAY_NAME_MAX} characters` };
  }
  return { ok: true, value };
}
