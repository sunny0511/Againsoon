# Againsoon

A warm, couple-first Expo app for proposing, negotiating, and locking in the next time you’ll see each other.

Two people share one couple space. One partner suggests a time (and optionally a place). The other accepts, counters, or declines. When you both agree, the meet is confirmed on a shared home calendar.

This repository is an MVP: the booking loop is fully usable on one device. Pairing and data live locally so a backend can be added later.

## Run it

```bash
npm install
npx expo start
```

Then:

- Press `w` for a web preview (best on this Linux/VM setup).
- Scan the QR code with **Expo Go** on iOS or Android.
- `npx expo start --web` opens the web preview directly.

Node 20+ is enough. No native Xcode/Android Studio build is required for the MVP.

## Demo the booking loop

The fastest path for a product walkthrough:

1. Open the app → **Get started** or **Try the demo couple**.
2. On pairing, tap **Open demo couple** (Maya & Jordan).
3. Home shows a confirmed dinner plus a pending picnic from Jordan.
4. Open the picnic → **This time works**, or **Suggest a different time**, or **Can't make it**.
5. Use the gold **Demo · viewing as Maya** banner to switch to Jordan and see the other side of a proposal.
6. Tap **Suggest a time** to send a new meet, then switch profiles to accept it.
7. **History** lists past meets. **You two** has the invite code (`HONEY·42` in the demo).

Invite codes:

- `DEMO` joins the sample couple as Jordan.
- Creating a couple generates a code you can copy/share. On this device, joining is simulated locally.

## What the MVP covers

- Onboarding and couple pairing (invite code, share text, or local demo)
- Home: next confirmed meet, 14-day strip, pending proposals
- Propose a meet: day, time of day, optional window, place, note
- Proposal detail: accept / counter / decline with a note / withdraw
- Confirmed meet detail
- Shared history of past and declined meets
- Switch whose eyes you’re using (one-phone demo)

## Intentionally stubbed

- Real accounts, push notifications, and a remote backend
- Native calendar export (“Add to calendar” explains this)
- Live location search and maps
- Multi-device sync (state is AsyncStorage on this device)

## Project shape

```
app/                 Expo Router screens
src/components/      UI primitives and meet cards
src/data/            Local store, persistence, selectors, seed demo
src/lib/             Dates, ids, invite codes
src/theme.ts         Color, type, spacing
src/types.ts         Domain model
```

`src/data/store.tsx` is the seam for a future API. Screens talk to actions (`propose`, `accept`, `counter`, `decline`) rather than to storage directly. Persistence is a small `loadState` / `saveState` helper around AsyncStorage.

## Stack

- Expo SDK 57, Expo Router, TypeScript
- React Native (iOS, Android, web)
- Local persisted state (AsyncStorage)
