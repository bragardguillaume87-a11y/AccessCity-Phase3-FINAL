const ALLOWED_CHARS = /^[\x20-\x7E\n\r\t]*$/;
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  if (!ALLOWED_CHARS.test(str)) throw new Error('Non-ASCII characters detected');
  return str.trim();
}
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeString(key)] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
  }
  return sanitized;
}