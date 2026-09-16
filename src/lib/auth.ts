import type { Auth } from 'firebase/auth';

import { createAuth } from '@/src/lib/authInstance';
import { getFirebaseApp } from '@/src/lib/firebase';
import { log } from '@/src/lib/log';

let auth: Auth | null = null;
let failed = false;

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  if (failed) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    auth = createAuth(app);
    return auth;
  } catch (error) {
    failed = true;
    log.error(error, 'firebase.auth');
    return null;
  }
}
