export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Whole-rupee PKR amounts — prevents float drift in sale math. */
export function roundPKR(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

/** Parse user-entered money as whole PKR (supports commas). */
export function parseMoneyInput(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '').trim();
  if (!cleaned) return 0;
  return roundPKR(Number.parseFloat(cleaned));
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundPKR(amount));
}

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PK', options).format(value);
}

export function formatCNIC(cnic: string): string {
  const digits = cnic.replace(/\D/g, '');
  if (digits.length !== 13) return cnic;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
