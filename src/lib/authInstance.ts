import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import { Platform } from 'react-native';

export function createAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    // RN-only export; the web auth bundle does not type this.
    const rnAuth = require('firebase/auth') as {
      getReactNativePersistence?: (storage: unknown) => unknown;
    };
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!rnAuth.getReactNativePersistence) {
      return getAuth(app);
    }
    return initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(AsyncStorage) as never,
    });
  } catch {
    return getAuth(app);
  }
}
