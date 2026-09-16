export function createId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

const WORDS = [
  'MAPLE',
  'HONEY',
  'OLIVE',
  'PEACH',
  'CEDAR',
  'AMBER',
  'CORAL',
  'LINEN',
  'DAWN',
  'MOSS',
];

export function createInviteCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const n = Math.floor(Math.random() * 90) + 10;
  return `${word}${n}`;
}

export function normalizeInviteCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function formatInviteCode(code: string): string {
  const normalized = normalizeInviteCode(code);
  if (normalized.length <= 2) return normalized;
  return `${normalized.slice(0, -2)}·${normalized.slice(-2)}`;
}
