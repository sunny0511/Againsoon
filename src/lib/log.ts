type LogContext = Record<string, unknown> | string | undefined;

function prefix(): string {
  return '[againsoon]';
}

/**
 * Crash-safe logger. Console is the default sink.
 * Optional Sentry: set EXPO_PUBLIC_SENTRY_DSN later and initialize in `installRemoteLogging`.
 */
export const log = {
  info(message: string, context?: LogContext) {
    if (context === undefined) console.log(prefix(), message);
    else console.log(prefix(), message, context);
  },
  warn(message: string, context?: LogContext) {
    if (context === undefined) console.warn(prefix(), message);
    else console.warn(prefix(), message, context);
  },
  error(error: unknown, context?: LogContext) {
    if (context === undefined) console.error(prefix(), error);
    else console.error(prefix(), context, error);
  },
};

let remoteInstalled = false;

export function installRemoteLogging() {
  if (remoteInstalled) return;
  remoteInstalled = true;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || dsn.startsWith('YOUR_')) {
    log.info('Remote crash reporting is not configured (console only).');
    return;
  }
  // Stub: wire @sentry/react-native here when you add the package.
  log.info('Sentry DSN present, but the Sentry SDK is not bundled yet.');
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) return friendlyFirebaseMessage(message);
  }
  return fallback;
}

export function friendlyFirebaseMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('auth/invalid-email')) return 'That email doesn’t look right.';
  if (lower.includes('auth/user-not-found') || lower.includes('auth/invalid-credential')) {
    return 'Email or password doesn’t match.';
  }
  if (lower.includes('auth/wrong-password')) return 'Email or password doesn’t match.';
  if (lower.includes('auth/email-already-in-use')) return 'That email already has an account. Sign in instead.';
  if (lower.includes('auth/weak-password')) return 'Use at least 6 characters for the password.';
  if (lower.includes('auth/too-many-requests')) return 'Too many tries. Wait a minute and try again.';
  if (lower.includes('auth/network-request-failed')) return 'Network error. Check your connection and retry.';
  if (lower.includes('auth/invalid-action-code')) return 'That sign-in link is invalid or already used.';
  if (lower.includes('permission-denied')) return 'You don’t have access to that couple.';
  if (lower.includes('unavailable')) return 'Againsoon can’t reach the server. Retry in a moment.';
  return message;
}
