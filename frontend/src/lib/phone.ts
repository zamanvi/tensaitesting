/**
 * Normalizes a Bangladeshi phone number for a `wa.me/` WhatsApp deep link,
 * which requires the full international number with no leading "0" or "+".
 *
 * Admins commonly enter the local format (e.g. "01571308347"). Passed
 * through unchanged, that produces a wa.me link missing the "880" country
 * code — a number that simply doesn't exist on WhatsApp, so the link opens
 * to nothing (or the wrong contact). This normalizes any of:
 *   "01571308347"    -> "8801571308347"
 *   "1571308347"     -> "8801571308347"
 *   "+8801571308347" -> "8801571308347"
 *   "8801571308347"  -> "8801571308347"
 */
export function normalizeBdWhatsapp(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0'))   return `880${digits.slice(1)}`;
  return `880${digits}`;
}
