# Againsoon

A warm, couple-first Expo app for proposing, negotiating, and locking in the next time you’ll see each other — with dual availability, date goals, wishlists, and memories around that booking loop.

Two people share one couple space. One partner suggests a time (and optionally a place). The other accepts, counters, or declines. When you both agree, the meet is confirmed. That loop is the product. Calendars, ideas, and key dates exist to make the next “yes” easier — not to become a household chore app.

This repository is a local MVP: the booking loop is fully usable on one device. Pairing and data live in AsyncStorage so a backend can be added later.

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

## Demo the competitive walkthrough

Fastest path (Maya & Jordan):

1. Open the app → **Get started** or **Try the demo couple**.
2. On pairing, tap **Open demo couple**.
3. **Home** shows:
   - a confirmed meet at the lantern steps (about 45 minutes out)
   - a date-goal card (`1 of 4` this month) with a gentle behind-pace nudge
   - a key-date countdown (cabin weekend, anniversary)
   - date prep for the next meet
   - pending picnic from Jordan
   - a memories strip from past dates
4. Open **Calendar**. Sample Google/Apple/Outlook calendars are mocked (no OAuth). Me / Them / Us are colour-coded. Tap a **mutual free window** (or a free hour in Day view) → propose flow, time prefilled.
5. Switch to Jordan via the demo banner. Open the picnic → **This time works**, or **Suggest a different time**, or **Can't make it**. Accepting plays a lock-in moment.
6. After a past confirmed meet (History → the river walk), add a **memory** note and optional photo.
7. **Ideas**: open a wishlist item → **Propose this**. Or use **Assist** (on-device, not a cloud LLM): pick vibe + budget → 2–3 suggestions → one-tap propose.
8. **Us**: cadence goal, key dates & reminder list, accent pair, calendar privacy (“Busy” vs titles), invite code `HONEY·42`.

Invite codes:

- `DEMO` joins the sample couple as Jordan.
- Creating a couple generates a code you can copy/share. On this device, joining is simulated locally.

To re-seed the demo after exploring, **Us → Start over**, then open the demo couple again.

## What this version covers

- Onboarding and couple pairing (invite code, share text, or local demo)
- Home: next meet, date goal + nudge, key-date countdown, date prep, pending proposals, memories
- Dual availability calendar (mocked): day/week, me/them/us, privacy, tap a free slot to propose
- Propose a meet: day, time of day, optional window, place, note — including prefills from calendar / wishlist / Assist
- Proposal detail: accept / counter / decline with a note / withdraw, plus lock-in delight
- Confirmed meet detail, hour-before location sharing, date-prep checklist
- Wishlists (title, notes, budget vibe) and on-device Assist
- Key dates, countdowns, local reminder list
- Memories on past confirmed meets (note + optional local photo or seeded stills)
- Shared history
- Customizable me/them/us accent pair
- Switch whose eyes you’re using (one-phone demo)

## Intentionally stubbed

- Real Google / Apple / Outlook OAuth (“Connect calendars — coming soon” with rich mock data)
- Push notifications and home-screen widgets
- Grocery / household chore suite (out of scope on purpose)
- Native calendar export (“Add to calendar” explains this)
- Live maps / place search (hour-before distance is estimated; GPS is used when allowed)
- Multi-device sync (state is AsyncStorage on this device)
- Cloud LLM (Assist is an on-device scorer over wishlist + a small recipe book)

## Project shape

```
app/                 Expo Router screens (tabs: Home, Calendar, Ideas, History, Us)
src/components/      UI primitives, calendar board, meet cards, memories
src/data/            Local store, persistence (v3), selectors, seed demo
src/lib/             Dates, availability, goals, Assist, ids
src/theme.ts         Color, type, spacing, accent presets
src/types.ts         Domain model
```

`src/data/store.tsx` is the seam for a future API. Screens talk to actions (`propose`, `accept`, `counter`, `decline`, plus wishlist / memory / goal helpers) rather than to storage directly. Persistence is a small `loadState` / `saveState` helper around AsyncStorage, with a v2 → v3 migrate.

## Stack

- Expo SDK 57, Expo Router, TypeScript
- React Native (iOS, Android, web)
- Local persisted state (AsyncStorage)
