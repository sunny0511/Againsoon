# App Store (iOS)

Againsoon is configured for a production App Store build. You still need an Apple Developer Program membership to upload.

## What’s already in the app
- Create account (email, password, name, accept privacy & terms)
- Sign in / sign out
- In-app **Delete account** (App Store requirement)
- Privacy Policy and Terms screens
- iOS bundle id `com.againsoon.app`, Android application id `com.againsoon.app`
- Export compliance flag `ITSAppUsesNonExemptEncryption = false`
- Location and photo permission strings
- EAS build + submit profiles in `eas.json`

## One-time Apple setup
1. Enroll at [developer.apple.com](https://developer.apple.com) (paid program).
2. In App Store Connect, create the app **Againsoon** with bundle id `com.againsoon.app`.
3. Host `docs/PRIVACY.md` at a public https URL (GitHub Pages is fine) and paste that URL into App Store Connect → App Privacy / Privacy Policy.
4. Install EAS CLI and log in:

```bash
npm install -g eas-cli
eas login
eas init   # link this repo to an Expo project
```

5. Build and submit:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

The first build will walk you through Apple distribution certificates. Use the Apple ID that owns the app.

## App Review notes (paste into App Store Connect)
```
Againsoon is a couples date-planning app.

Create an account with any email + password (8+ characters), then Create couple
or Join with a code.

To review the full booking loop without pairing a second person:
Welcome → Explore sample couple.

That sandbox (Maya & Jordan) includes dual calendars, a pending picnic
proposal, lock-in, lists, maps, and Assist. Switch profiles with the
demo banner to accept as the other partner.

No backend login is required. Data stays on device.
```

## Reviewer demo account (optional)
Explore sample couple is enough. If you prefer a password login:

- Email: `demo@againsoon.app`
- Password: `DemoCouple1`  
  (created automatically the first time someone opens the sample couple)

## What this first store version does not include
- iCloud / multi-device sync (each phone has its own local couple)
- Sign in with Apple (not required until we add other social logins)
- Native home-screen widget binary (the in-app `/widget` screen is pin-able on web)

## Play Store
See **[PLAY_STORE.md](./PLAY_STORE.md)** for Play Console, Data safety answers, AAB vs APK, and submit-as-draft.

```bash
npm run eas:build:android
npm run eas:submit:android
```
