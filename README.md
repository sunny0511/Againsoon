# Againsoon

A warm, couple-first Expo app for proposing, negotiating, and locking in the next time you’ll see each other — with dual availability, date goals, wishlists, and memories around that booking loop.

Two people share one couple space. One partner suggests a time (and optionally a place). The other accepts, counters, or declines. When you both agree, the meet is confirmed. That loop is the product.

This branch is the **production foundation**: Firebase Auth + Firestore realtime sync, so two real phones can share the same couple. The Maya & Jordan demo remains as a clearly labeled **offline / dev fallback**, not the live path.

## Run it

```bash
npm install
npx expo start
```

Then:

- Press `w` for a web preview (best on this Linux/VM setup).
- Scan the QR code with **Expo Go** on iOS or Android.
- `npx expo start --web` opens the web preview directly.

On a phone, use Expo Go rather than a `localhost` link from another machine.

Node 20+ is enough. No native Xcode/Android Studio build is required to develop.

Without Firebase config the app still boots: you can walk the full booking loop as the offline demo couple.

## Production-readiness

### Local demo (no Firebase)

1. Open the app → **Try the offline demo**.
2. On pairing, tap **Open demo couple**.
3. Home, Calendar, Ideas, History, and Us work as before.
4. The banner says **Offline demo**. Switch profiles on this phone to accept / counter / lock in.

Invite code `DEMO` / `HONEY42` still joins the sample couple as Jordan **on this device**.

### Firebase setup (live two-person path)

You create the Firebase project. This repo never commits a private key.

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Add an **Web** app (required for Expo). Optionally add iOS (`com.againsoon.app`) and Android (`com.againsoon.app`).
3. Authentication → Sign-in method:
   - Enable **Email/Password**.
   - Enable **Email link (passwordless sign-in)**.
4. Firestore → Create database (production mode).
5. Deploy rules and indexes from this repo:

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add   # select your project
   firebase deploy --only firestore
   ```

   Files: `firestore.rules`, `firestore.indexes.json`, `firebase.json`.
6. Copy the web app config into `.env` (see `.env.example`):

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

   Restart Expo after changing env. You can also paste the same values into `app.json` → `expo.extra.firebase`.
7. Authorized domains: add `localhost` (dev) and any hosting domain. For magic links set `EXPO_PUBLIC_AUTH_CONTINUE_URL` to an **https** URL on an authorized domain (for example `https://your-project.firebaseapp.com/auth/complete`). Email/password works without that.
8. Native Google files are optional until you do a store build. Copy placeholders and replace values:
   - `google-services.json.example` → `google-services.json` (gitignored)
   - `GoogleService-Info.plist.example` → `GoogleService-Info.plist` (gitignored)

The client only uses the **public** Firebase web config (`EXPO_PUBLIC_*`). Never commit a service-account private key.

### Two-device test (success path)

Two browsers, two simulators, or two phones.

1. Device A: **Continue with email** → create an account (name + email + password).
2. **Create couple**. Copy the invite code from Us (it expires in 7 days; rotate from Us anytime).
3. Device B: **Continue with email** → create a *different* account.
4. **Join with a code** → paste Device A’s code.
5. Device A proposes a time (Home or Calendar).
6. Device B opens the pending meet → **This time works**.
7. Both Home screens show the lock-in / confirmed meet.

Leave/unpair is confirm-gated on Us. After leaving, the remaining partner can rotate the code and invite again.

If Firestore isn’t configured, those screens stay available as the offline demo so development doesn’t block.

## What this version covers

- Email + password auth, session persist, sign out
- Magic-link / email sign-in (needs an authorized continue URL)
- Couple create / join via short invite codes (expire + rotate)
- Realtime Firestore sync for proposals, meets, wishlist, key dates, memories, date-prep, date goals, mock calendars
- Strict Firestore rules: only couple members can read/write that couple’s workspace
- Optimistic UI on the booking loop; sync errors show a retry banner
- Offline demo couple, clearly labeled
- EAS preview + production profiles (`eas.json`) for later TestFlight / Play internal tracks

## Intentionally stubbed

- Real Google / Apple / Outlook OAuth (“Connect calendars — coming soon” with rich mock data)
- Push notifications and home-screen widgets
- Grocery / household chore suite (out of scope on purpose)
- Native calendar export (“Add to calendar” explains this)
- Live maps / place search (hour-before distance is estimated; GPS is used when allowed)
- Cloud LLM (Assist is an on-device scorer over wishlist + a small recipe book)
- App Store / Play Console submission (`eas.json` is the starter; run `eas init` then `eas build --profile preview`)
- Sentry (console logging now; `EXPO_PUBLIC_SENTRY_DSN` is a stub)

## Project shape

```
app/                 Expo Router screens (tabs: Home, Calendar, Ideas, History, Us)
app/auth/            Sign in, sign up, magic-link complete
src/components/      UI primitives, calendar board, meet cards, session banner
src/data/            Store seam, reducer, local persist, Firestore repository
src/lib/             Firebase init, dates, availability, goals, Assist, ids
firestore.rules      Restrictive membership rules
eas.json             development / preview / production profiles
```

Screens still talk to `src/data/store.tsx` (`propose`, `accept`, `counter`, `joinWithCode`, …). They do not call Firestore directly. When signed in and paired, the store writes through `src/data/cloud.ts` and listens in realtime. Demo / unpaired-local still use AsyncStorage.

## Stack

- Expo SDK 57, Expo Router, TypeScript
- React Native (iOS, Android, web)
- Firebase Auth + Cloud Firestore (optional; demo works without it)
- Local persisted state (AsyncStorage) for the offline demo
