import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createId } from '@/src/lib/id';

export const ACCOUNTS_KEY = 'againsoon.accounts.v1';
export const SESSION_KEY = 'againsoon.session.v1';
export const SANDBOX_EMAIL = 'demo@againsoon.app';

export type AccountRecord = {
  id: string;
  email: string;
  name: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  isSandbox?: boolean;
};

export type Session = {
  accountId: string;
  email: string;
  name: string;
  isSandbox?: boolean;
};

export type AuthErrorCode = 'invalid-email' | 'weak-password' | 'mismatch' | 'exists' | 'not-found' | 'bad-credentials' | 'terms';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function sessionFromAccount(account: AccountRecord): Session {
  return {
    accountId: account.id,
    email: account.email,
    name: account.name,
    isSandbox: account.isSandbox,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  return null;
}

async function secretGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secretSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secretRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

export async function loadAccounts(): Promise<AccountRecord[]> {
  const raw = await secretGet(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAccounts(accounts: AccountRecord[]): Promise<void> {
  await secretSet(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await secretGet(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accountId || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session | null): Promise<void> {
  if (!session) {
    await secretRemove(SESSION_KEY);
    return;
  }
  await secretSet(SESSION_KEY, JSON.stringify(session));
}

export async function createAccount(input: {
  email: string;
  name: string;
  password: string;
  confirm: string;
  acceptedTerms: boolean;
  isSandbox?: boolean;
}): Promise<Session> {
  if (!input.acceptedTerms) {
    throw new AuthError('terms', 'Please agree to the privacy policy and terms.');
  }
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new AuthError('invalid-email', 'Enter a valid email address.');
  }
  const weak = validatePassword(input.password);
  if (weak) throw new AuthError('weak-password', weak);
  if (input.password !== input.confirm) {
    throw new AuthError('mismatch', 'Those passwords don’t match.');
  }
  const name = input.name.trim();
  if (!name) throw new AuthError('invalid-email', 'Enter your first name.');

  const accounts = await loadAccounts();
  if (accounts.some((account) => account.email === email)) {
    throw new AuthError('exists', 'An account with that email already exists. Sign in instead.');
  }

  const salt = bytesToHex(Crypto.getRandomBytes(16));
  const passwordHash = await hashPassword(input.password, salt);
  const record: AccountRecord = {
    id: createId('acct'),
    email,
    name,
    passwordSalt: salt,
    passwordHash,
    createdAt: new Date().toISOString(),
    isSandbox: input.isSandbox,
  };
  await saveAccounts([...accounts, record]);
  const session = sessionFromAccount(record);
  await saveSession(session);
  return session;
}

export async function authenticate(email: string, password: string): Promise<Session> {
  const normalized = normalizeEmail(email);
  const accounts = await loadAccounts();
  const record = accounts.find((account) => account.email === normalized);
  if (!record) {
    throw new AuthError('not-found', 'No account with that email. Create one first.');
  }
  const hash = await hashPassword(password, record.passwordSalt);
  if (hash !== record.passwordHash) {
    throw new AuthError('bad-credentials', 'Email or password is incorrect.');
  }
  const session = sessionFromAccount(record);
  await saveSession(session);
  return session;
}

export async function ensureSandboxAccount(): Promise<Session> {
  const accounts = await loadAccounts();
  const existing = accounts.find((account) => account.isSandbox || account.email === SANDBOX_EMAIL);
  if (existing) {
    const session = sessionFromAccount({ ...existing, isSandbox: true });
    await saveSession(session);
    return session;
  }
  return createAccount({
    email: SANDBOX_EMAIL,
    name: 'Maya',
    password: 'DemoCouple1',
    confirm: 'DemoCouple1',
    acceptedTerms: true,
    isSandbox: true,
  });
}

export async function deleteAccountRecord(accountId: string): Promise<void> {
  const accounts = await loadAccounts();
  await saveAccounts(accounts.filter((account) => account.id !== accountId));
  const session = await loadSession();
  if (session?.accountId === accountId) {
    await saveSession(null);
  }
}

export async function signOutSession(): Promise<void> {
  await saveSession(null);
}
