// Input sanitization strips HTML tags and control characters from every string in the JSON body so stored text can never carry markup into the UI.
// Passwords are left untouched on purpose (changing them would corrupt credentials).
const SKIP_KEYS = new Set(['password']);

export function sanitizeString(value) {
  return value
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

export function sanitizeDeep(value, key) {
  if (typeof value === 'string') return SKIP_KEYS.has(key) ? value : sanitizeString(value);
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeDeep(v, k)]));
  }
  return value;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeDeep(req.body);
  next();
}
