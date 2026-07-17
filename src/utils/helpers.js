export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function diffMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

export function minutesToHHMM(mins) {
  if (!mins || mins < 0) return '0h 0m';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(pwd)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(pwd)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(pwd)) errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('At least one special character');
  return errors;
}

export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}
