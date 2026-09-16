import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { log } from '@/src/lib/log';

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function clean(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('YOUR_') || trimmed.startsWith('your-')) return '';
  return trimmed;
}

function extraFirebase(): Partial<FirebasePublicConfig> {
  const extra = Constants.expoConfig?.extra as { firebase?: Partial<FirebasePublicConfig> } | undefined;
  return extra?.firebase ?? {};
}

export function getFirebaseConfig(): FirebasePublicConfig | null {
  const extra = extraFirebase();
  const config: FirebasePublicConfig = {
    apiKey: clean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) || clean(extra.apiKey),
    authDomain: clean(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) || clean(extra.authDomain),
    projectId: clean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) || clean(extra.projectId),
    storageBucket: clean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) || clean(extra.storageBucket),
    messagingSenderId:
      clean(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || clean(extra.messagingSenderId),
    appId: clean(process.env.EXPO_PUBLIC_FIREBASE_APP_ID) || clean(extra.appId),
  };
  if (!config.apiKey || !config.projectId || !config.appId || !config.authDomain) {
    return null;
  }
  return config;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() != null;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let initFailed = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (initFailed) return null;
  const config = getFirebaseConfig();
  if (!config) return null;
  try {
    app = getApps().length ? getApp() : initializeApp(config);
    return app;
  } catch (error) {
    initFailed = true;
    log.error(error, 'firebase.init');
    return null;
  }
}

export function getFirebaseDb(): Firestore | null {
  if (db) return db;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  db = getFirestore(firebaseApp);
  return db;
}

export function getAuthContinueUrl(): string | undefined {
  return clean(process.env.EXPO_PUBLIC_AUTH_CONTINUE_URL) || undefined;
}
