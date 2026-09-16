export const BUNDLE_ID = 'com.againsoon.app';
export const APPLICATION_ID = 'com.againsoon.app';
export const SUPPORT_EMAIL = 'hello@againsoon.app';
export const APP_VERSION = '1.0.0';

export function isStoreBuild(): boolean {
  return typeof __DEV__ !== 'undefined' ? !__DEV__ : false;
}
