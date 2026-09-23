/**
 * Safely parse date strings into epoch milliseconds.
 * Normalizes PocketBase space-separated timestamps ('YYYY-MM-DD HH:MM:SS.000Z')
 * to standard ISO-8601 strings ('YYYY-MM-DDTHH:MM:SS.000Z') for universal browser compatibility.
 */
export function parseDate(dateStr?: string | null): number {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return 0;
  const normalized = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  const time = new Date(normalized).getTime();
  return isNaN(time) ? 0 : time;
}
