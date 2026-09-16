# Play Store (Android)

Againsoon is configured for a production Google Play upload (Android App Bundle). You still need a Play Console developer account and `eas login` to ship.

Package / application id: **`com.againsoon.app`**
Min SDK: **24** (Android 7)
Target / compile SDK: **36** (Android 16 — required for new Play apps as of 31 August 2026)
Advertising ID: **blocked** (no ads, no Play AD_ID permission)
Device backups: **disabled** (`allowBackup: false`) so couple data is not included in Google backup

iOS is documented separately in [APP_STORE.md](./APP_STORE.md). Accounts, delete-account, and Privacy / Terms are shared.

## What’s already in the app
- Create account (email, password, name, accept privacy & terms)
- Sign in / sign out
- In-app **Delete account** (Play account-deletion requirement)
- Privacy Policy and Terms screens (`/legal/privacy`, `/legal/terms`)
- Foreground location only (hour-before distance). Background location is blocked.
- Photo picker for memories (optional)
- Production EAS profile builds an **AAB**; preview builds an sideload **APK**
- Submit profile uploads to the **internal** track as a **draft** (not sent for review until you promote it)

## One-time Google setup
1. Enroll at [play.google.com/console](https://play.google.com/console) (one-time Play Console fee).
2. Create the app **Againsoon**, package `com.againsoon.app`, default language English.
3. Host `docs/PRIVACY.md` at a public https URL (GitHub Pages is fine) and paste that URL into:
   - Store listing → Privacy policy
   - App content → Privacy policy
4. Complete App content (see checklists below): Data safety, Advertising ID = No, Target audience, News / COVID / government = No, Content rating.
5. Create an internal testing track. Add your Gmail as a tester.
6. Install EAS CLI and log in:

```bash
npm install -g eas-cli
eas login
eas init   # link this repo to an Expo project
```

7. Create a Play Console service account with **Release apps** permission, download the JSON key, and let EAS store it (do not commit the file):

```bash
eas credentials -p android
# or pass the key once:
# eas submit --platform android --profile production -- --google-service-account-key path/to/play-service-account.json
```

## Build and submit

Internal sideload APK (friends / your own phone):

```bash
npm run eas:build:android:preview
```

Play production AAB, then draft on the internal track:

```bash
npm run eas:build:android
npm run eas:submit:android
```

Equivalent:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

The first production build will create an upload keystore on Expo. Opt in to **Play App Signing** when Play Console asks (recommended). Promote Internal → Closed → Production from Play Console when you are ready; this repo submits as `releaseStatus: draft` so nothing goes live by itself.

## Store listing copy

**App name:** Againsoon

**Short description** (≤ 80 characters):
```
Propose, counter, and lock in the next time you’ll see each other.
```

**Full description:**
```
Againsoon is a couples date-planning app. Two people share one couple space. One partner suggests a time (and optionally a place). The other accepts, counters, or declines. When you both agree, the meet is confirmed.

That booking loop is the product. Dual calendars, date ideas, shared grocery and chore lists, live maps, and Assist exist to make the next yes easier.

Create an account, start a couple or join with a code, and keep plans on this device. Explore the sample couple (Maya & Jordan) to try the full loop without pairing a second phone.

This version stores couple data on the device. Multi-device sync is not included yet.
```

**Category:** Lifestyle (or Dating only if Play’s dating questionnaire fits; Lifestyle is the better match — this is planning for an existing couple, not matching strangers).

**Contact:** hello@againsoon.app

## Graphics Play will ask for
- High-res icon: 512 × 512 PNG (export from `assets/images/icon.png`)
- Feature graphic: 1024 × 500
- Phone screenshots: at least 2 (Home, Calendar, a proposal, Us)
- 7-inch / 10-inch tablet screenshots: optional (iOS already supports tablet; Android will too)

Capture these from a production or preview build. Adaptive icons already ship in the AAB.

## App content checklists

### Advertising ID
Does your app use the advertising ID? **No.**
`com.google.android.gms.permission.AD_ID` is in `blockedPermissions`.

### Ads
The app does not contain ads.

### Target audience
- Not designed for children
- Target age: **18 and over** (couples planning)
- Store presence: all countries you want, starting with your home country

### Content rating
Run the IARC questionnaire. Expected outcome is a low maturity rating (no violence, no sexual content, no user-to-user matching of strangers). Mention user-generated notes/photos on memories if asked.

### Government / financial / health / news
No.

### App access (for review)
```
Againsoon is a couples date-planning app.

Create an account with any email + password (8+ characters), then Create couple
or Join with a code.

To review the full booking loop without pairing a second person:
Welcome → Explore sample couple.

That sandbox (Maya & Jordan) includes dual calendars, a pending picnic
proposal, lock-in, lists, maps, and Assist. Switch profiles with the
demo banner to accept as the other partner.

No backend login is required. Data stays on the device.

Optional password login for the sample:
Email: demo@againsoon.app
Password: DemoCouple1
```

### Account deletion
In-app: **Us → Delete account**. That wipes the local account, session, and couple data.

Because this version has no cloud account server, there is nothing to delete on our side after uninstall. Keep `hello@againsoon.app` as the contact for deletion requests from people who already uninstalled.

## Data safety form

Play’s “collected” means data that **leaves the device** (including to third-party APIs). Account email, name, hashed password, photos, calendars, and GPS for hour-before distance stay on the phone and are **not collected** by Againsoon.

**Does the app collect or share user data?** Yes.

| Data type | Collected | Shared | Optional | Purpose | Notes |
| --- | --- | --- | --- | --- | --- |
| App activity → In-app search history | Yes | Yes | Yes | App functionality | Place search query string sent to Photon (Komoot), Open-Meteo, or Nominatim so we can drop a map pin. We do not store the query. |
| User-generated content → Other | Yes | Yes | Yes | App functionality | Assist prompts sent to Pollinations (`gen.pollinations.ai`) or a URL you set with `EXPO_PUBLIC_LLM_*`. On-device fallback if the call fails. We do not store prompts. |
| Location | No | No | Yes | App functionality | GPS is used on-device in the hour before a confirmed meet. It is not uploaded. Background location is not requested. |
| Personal info (email, name) | No | No | — | — | Stored in device secure storage only. |
| Photos | No | No | Yes | — | Memory photos stay on the device. |
| Device or other IDs | No | No | — | — | Advertising ID permission is blocked. |

- Data is encrypted in transit (HTTPS).
- Data is not sold.
- Data is not used for advertising, personalization, or fraud beyond serving the feature.
- Users can decline place search and Assist; the rest of the app still works.
- Account deletion: **Us → Delete account**.

Do **not** check “ephemeral” unless you are sure the third-party APIs discard the request. We cannot control their logs.

## Permissions justification (Play Console, if asked)

| Permission | Why |
| --- | --- |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Optional hour-before “how far are we” estimate vs the meet pin. Foreground only. |
| Photos / media (image picker) | Optional photo on a memory of a past date. |
| `INTERNET` | Place search, map tiles, Assist. |

Not requested: background location, advertising ID, contacts, SMS, camera (unless the system photo picker surfaces it), microphone.

## What this first store version does not include
- Multi-device / cloud sync (each phone has its own local couple)
- Google Play Games, Sign in with Google
- Native home-screen widget (the in-app `/widget` screen is pin-able on web)
- Push notifications / FCM
- R8 minify on the first release (left off because of Reanimated; turn it on after a production AAB is proven)

## After a successful internal draft
1. Install the internal track build on a physical Android phone.
2. Walk Create account → Create couple → propose → counter → lock-in, plus Explore sample couple.
3. Confirm Us → Delete account.
4. When that is solid, in Play Console promote the release to Production and send it for review.
