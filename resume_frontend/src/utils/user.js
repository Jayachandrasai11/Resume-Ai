export function parseAdminEmails(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function inferRoleFromEmail(email) {
  const adminEmails = parseAdminEmails(import.meta.env.VITE_ADMIN_EMAILS);
  const e = (email || '').toLowerCase().trim();
  if (e && adminEmails.includes(e)) return 'admin';
  return '';
}

export function computeDisplayName(u) {
  if (!u) return '';
  const full =
    (typeof u.full_name === 'string' ? u.full_name : '') ||
    `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return (full || u.username || u.email || '').trim();
}
