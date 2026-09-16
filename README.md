# Againsoon

A couple-first Expo app for proposing, negotiating, and locking in the next time you’ll see each other — plus the shared life tools couples actually use.

Againsoon’s core loop is unique: one partner suggests a time, the other accepts, counters, or declines. Around that we shipped a darker midnight look and the features people expect from apps like Cupla, without turning this into a generic household dashboard.

## Run it

```bash
npm install
npx expo start
```

Then:

- Press `w` for a web preview.
- Scan the QR code with **Expo Go** on iOS or Android.
- `npx expo start --web` opens the web preview directly.

On a phone, use Expo Go rather than a `localhost` link from another machine.

## Demo

1. **Try the demo couple** (Maya & Jordan).
2. **Home** — next meet, date-night goal, key-date countdown, hour-before location, pending proposals.
3. **Plan** — both calendars, busy/free privacy, propose a pocket you’re both free.
4. **Ideas** — Spark finds mutual free evenings and turns wishlist items into real proposals.
5. **Us** — grocery/to-do lists, memories, key dates.
6. **You** — invite code, date goal cadence, location sharing, switch profiles.

Invite codes: `DEMO` joins as Jordan. Creating a couple generates a shareable code.

## What we ship that Cupla-style apps have — and what we do differently

**Also in Againsoon**

- Shared calendar with colour-coded you / them / us
- Per-block privacy (`busy` vs details)
- Wishlists (including private gift ideas)
- Date-night goal and progress
- Key dates and countdowns
- Shared grocery + to-do lists
- Memories of past meets

**Againsoon-only**

- Propose → counter → accept negotiation (not just drop an event on a calendar)
- Optional hour-before location so you can see how far apart you are
- Spark: suggestions only in slots you’re both actually free

## Stubbed on purpose

- Google/Apple/Outlook two-way sync (Plan uses in-app busy blocks for now)
- Push notifications and phone widgets
- Live maps / aisle databases
- Multi-device accounts (local AsyncStorage)

## Stack

Expo SDK 57, Expo Router, TypeScript, local persisted state.
