# Againsoon

A warm, couple-first Expo app for proposing, negotiating, and locking in the next time you’ll see each other — with dual availability, date goals, wishlists, memories, shared lists, live maps, and a home widget around that booking loop.

Two people share one couple space. One partner suggests a time (and optionally a place). The other accepts, counters, or declines. When you both agree, the meet is confirmed. That loop is the product. Calendars, ideas, lists, and maps exist to make the next “yes” easier.

This version is App Store–ready: create an account, pair, and use the booking loop. Couple data still lives on this device (ready for a later sync backend).

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

Node 20+ is enough. No native Xcode/Android Studio build is required for the MVP.

## Demo the competitive walkthrough

Fastest path (Maya & Jordan):

1. Open the app → **Create account** (or **Explore sample couple**).
2. For a real couple: email, password (8+), first name, accept Privacy & Terms → **Create couple** or join with a code.
3. Fastest review path: **Explore sample couple** → **Open sample couple** (Maya & Jordan).
3. **Home** shows:
   - a confirmed meet at the lantern steps (about 45 minutes out)
   - a date-goal card (`1 of 4` this month) with a gentle behind-pace nudge
   - a key-date countdown (cabin weekend, anniversary)
   - date prep for the next meet
   - groceries and chores for the lantern steps
   - the home widget card
   - pending picnic from Jordan
   - a memories strip from past dates
4. Open **Calendar**. Sample Google/Apple/Outlook calendars are mocked (no OAuth). Me / Them / Us are colour-coded. Tap a **mutual free window** (or a free hour in Day view) → propose flow, time prefilled.
5. Switch to Jordan via the demo banner. Open the picnic → **This time works**, or **Suggest a different time**, or **Can't make it**. Accepting plays a lock-in moment.
6. After a past confirmed meet (History → the river walk), add a **memory** note and optional photo.
7. **Ideas**: open a wishlist item → **Propose this**. Or use **Assist**: pick vibe + budget → cloud LLM suggestions (on-device fallback if the network is out) → one-tap propose.
8. **Propose** a place: type a venue, pick a live map result, see the OSM pin.
9. **Us**: cadence goal, groceries & chores, home widget, key dates, accent pair, calendar privacy, invite code `HONEY·42`.

Invite codes:

- `DEMO` joins the sample couple as Jordan.
- Creating a couple generates a code you can copy/share. On this device, joining is simulated locally.

To re-seed the demo after exploring, **Us → Start over**, then open the demo couple again.

## What this version covers

- Onboarding: create account (email + password), sign in, delete account, Privacy & Terms
- Couple pairing (invite code, share text, or sample couple for review)
- Home: next meet, date goal + nudge, key-date countdown, date prep, groceries, chores, widget, pending proposals, memories
- Dual availability calendar (mocked): day/week, me/them/us, privacy, tap a free slot to propose
- Propose a meet: day, time of day, optional window, live place search, note — including prefills from calendar / wishlist / Assist
- Proposal detail: accept / counter / decline with a note / withdraw, plus lock-in delight
- Confirmed meet detail, live OSM map, hour-before location sharing (GPS vs venue pin)
- Wishlists and cloud Assist (Pollinations by default; optional `EXPO_PUBLIC_LLM_API_KEY` / `EXPO_PUBLIC_LLM_BASE_URL`)
- Shared grocery + chores lists
- Key dates, countdowns, reminder list, home widget (`/widget` — Add to Home Screen)
- Memories on past confirmed meets (note + optional local photo or seeded stills)
- Shared history
- Customizable me/them/us accent pair
- Switch whose eyes you’re using (one-phone demo)

## Intentionally stubbed

- Real Google / Apple / Outlook OAuth (“Connect calendars — coming soon” with rich mock data)
- Native iOS/Android home-screen widget binaries (the `/widget` payload is ready; pin it on the web)
- Push notifications
- Native calendar export (“Add to calendar” explains this)
- Multi-device sync (state is AsyncStorage on this device)

## Cloud Assist

By default Assist posts to `https://gen.pollinations.ai/v1/chat/completions`. To point at your own OpenAI-compatible model:

```bash
EXPO_PUBLIC_LLM_BASE_URL=https://api.openai.com/v1/chat/completions
EXPO_PUBLIC_LLM_API_KEY=sk-...
EXPO_PUBLIC_LLM_MODEL=gpt-4.1-mini
npx expo start
```

If the cloud call fails (or the browser blocks the public endpoint), Assist falls back to the on-device wishlist/recipe scorer.

## App Store

iOS bundle id is `com.againsoon.app`. See **[docs/APP_STORE.md](docs/APP_STORE.md)** for EAS build, App Review notes, and the privacy URL. In-app policy: `/legal/privacy` and `/legal/terms` (also `docs/PRIVACY.md` / `docs/TERMS.md`).

## Project shape

```
app/                 Expo Router screens (tabs: Home, Calendar, Ideas, History, Us)
src/components/      UI primitives, calendar board, maps, lists, widget, memories
src/data/            Auth (secure session), local store, persistence, seed
src/lib/             Dates, availability, goals, Assist/LLM, places, ids
src/theme.ts         Color, type, spacing, accent presets
src/types.ts         Domain model
```

`src/data/store.tsx` is the seam for a future API. Screens talk to actions (`propose`, `accept`, `counter`, `decline`, plus wishlist / memory / list / goal helpers) rather than to storage directly. Persistence is a small `loadState` / `saveState` helper around AsyncStorage, with a v2 → v3 migrate.

## Stack

- Expo SDK 57, Expo Router, TypeScript
- React Native (iOS, Android, web)
- Accounts in SecureStore (keychain); couple data in AsyncStorage per account
- OpenStreetMap / Photon / Open-Meteo for live maps
- Cloud LLM via OpenAI-compatible chat completions
- EAS Build (`eas.json`) for App Store / Play
