# The Grill Exchange

An all-you-can-eat KBBQ / hot pot value calculator. You log what you ate, it
tells you whether you beat the house. Deliberately framed as a trading P&L —
your dinner as a position against the restaurant's margin.

Stack: Vite + React 18. No UI framework, no state library, no backend. Plain
CSS scoped under `.gx-root`.

```
npm install
npm run dev      # http://localhost:5173 — vite is bound to 0.0.0.0, so you can
                 # also open it on your phone at http://<your-lan-ip>:5173
npm run build
```

## The one rule that matters

**This app values food in dollars, never calories.** A "how many more calories
until you break even" counter is a bad thing to put in someone's hands. The
whole premise is dollar value recovered against the cover charge. Don't add
calorie tracking, nutrition data, or anything that turns this into an eating
target. If a feature idea needs that to work, the feature is wrong.

## Architecture

| File | What it holds |
|---|---|
| `src/menu.js` | All menu data, market anchors + cut multipliers, category ordering, verdict tiers. The only file you touch to retune values or add items. |
| `src/market.js` | Live BLS price fetch, 24h localStorage cache, baked-in offline fallback. Pure async, no React. |
| `src/party.js` | Party reducer + all the per-person money math. Pure, no React, no menu import — so it can be unit-tested directly under node. |
| `src/receipt.js` | Canvas renderer for the shareable receipt. |
| `src/easterEggs.js` | Trigger predicates for easter eggs. Pure, so "what fires" is testable apart from the effect that celebrates it. |
| `src/analyst.js` | Analyst-note predicates + the context they reason over. Pure; lines are authored by King, not generated. |
| `src/confetti.js` | Hand-rolled canvas confetti burst. Returns a cancel function. |
| `src/GrillExchange.jsx` | The component. Wiring and markup. |
| `src/GrillExchange.css` | All styling, scoped under `.gx-root`. |
| `src/main.jsx` | Entry point. |

Party state lives in a `useReducer` in `party.js`:

```
people   [{ id, name }]              the party, in seating order
activeId whose plate taps land on — a person id, or TABLE
counts   { [ownerId]: { [itemId]: n } }
seq      monotonic id source
```

`cover`, `minutes` and `mode` stay as plain `useState` — they don't interact
with anything. `derive()` turns party state into per-person lines plus the
table's book; everything the UI and receipt render comes from that one call.

The reducer must stay **pure** — StrictMode double-invokes it in dev. That is
why ids come from `seq` and not `Date.now()` or `Math.random()`.

## Domain notes

- `v` on each item is **the raw market cost of one round**, not an a-la-carte
  menu price. A round is `pricePerLb * lb`, where `lb` is 0.5 for meat and
  seafood and 0.25 for vegetables and carbs. For anything BLS publishes,
  `pricePerLb` is pulled live at runtime (`src/market.js`) and scaled by a
  per-cut multiplier `k` that positions the cut against its BLS aggregate —
  ribeye trades above the all-steaks average, brisket below all-other-beef.
  `k` is the only hand-set number in a market-linked item.
- **This replaced an a-la-carte basis (Aug 2026)** where `v` was the value of a
  3-4 oz AYCE plate priced off restaurant menus. The question changed from "did
  I beat the menu price" to "what is the meat actually worth", which shifts the
  whole distribution down — a cover charge is mostly not protein. `VERDICTS`
  was recalibrated to match; break-even stayed pinned at 1.0. Don't "fix" the
  low ratios by inflating `v` back toward menu prices — that silently restores
  the old question.
- **Not everything is live, and the gap is deliberate.** BLS covers beef, pork
  and chicken. It publishes nothing usable for lamb, seafood, or Asian produce
  (no enoki, napa, or bok choy at any granularity). Those carry a hand-set `v`
  with `est: true`, which renders a small `e` on the card. Never invent an
  anchor for them by borrowing a beef series — a wrong source is worse than an
  honest estimate.
- **The BLS batch POST is unusable from a browser** — its CORS preflight
  returns 405. Plain GETs carry `access-control-allow-origin: *` and need no
  preflight, so `market.js` issues one GET per anchor. The unregistered API
  allows 25 requests/day/IP, which is why there are exactly six anchors and a
  24h localStorage cache. Map new cuts onto an existing anchor with a `k`
  rather than adding a seventh series.
- **`VITE_BLS_KEY` is optional and not a secret.** Set in `.env.local` it
  raises the limit to 500/day counted per key rather than per IP, which is what
  makes the app usable by a whole table on one restaurant wifi. Vite inlines
  `VITE_*` at build time, so the key ships readable inside the bundle — that is
  acceptable only because BLS keys carry no billing and unlock no private data.
  Never put a real secret behind a `VITE_` prefix. Without a key everything
  still works at the lower limit; with an invalid one BLS returns
  `REQUEST_NOT_PROCESSED` and the app falls back to baked-in prices.
- **Over quota is a 200, not an HTTP error.** BLS answers a spent quota with
  `status: "REQUEST_NOT_PROCESSED"` and a 200, so `res.ok` proves nothing —
  `fetchOne` has to check the status field or stale data slips through silently.
- Drinks are the one exception to the market basis: alcohol is essentially
  never inside an AYCE cover, so `v` for those stays the real menu price,
  tagged `menu: true` and deliberately given no `e` marker. Note the model does
  not add them to `paid`, so logging a soju currently reads as free recovered
  value. Unresolved — see "Not yet decided".
- `ratio = eaten / paid` drives everything: the verdict tier, the color tone,
  the progress bar. Break-even is 1.0.
- Mode tabs filter which items are *visible*; they do not reset `counts`.
  Combo KBBQ+hotpot restaurants exist and switching tabs shouldn't wipe a log.
- `TABLE` is a reserved owner id for plates nobody can claim — the brisket
  everyone picked at. Its value splits evenly across the party. Without it,
  shared food gets assigned to whoever happened to tap and the per-person P&L
  becomes fiction. Adding or removing a diner re-splits it automatically.
- Every diner gets their own verdict against their own cover; the table gets a
  pooled one. `derive()` guarantees the per-person totals sum to the book
  exactly, so a receipt never shows money that came from nowhere.
- The party can never reach zero people — `paid` would divide by nothing.
- `VERDICTS` must stay sorted ascending by `max` — lookup takes the first match.
- `tone` (`loss` / `flat` / `win`) is the color system. Adding a tier means
  picking one of those three, not inventing a fourth color.
- **CSS trap:** the reset `.gx-root button{background:none}` is specificity
  (0,1,1) and beats any bare single-class rule like `.gx-share{background:…}`.
  A button that paints a background must be written `.gx-root .gx-share{…}` or
  it silently renders transparent.

## Analyst notes

A one-line read on the current book, shown under the stats in the board. The
predicates live in `src/analyst.js` and stay pure; `noteContext()` precomputes
the fact sheet (concentration, category shares, spread, rank, idle/elapsed
minutes) so each `when` is a one-liner.

- **The lines are King's to write, not Claude's.** Every note ships with
  `line: ""`, and an empty line is DISABLED — `evaluateNotes` filters it out.
  That is the mechanism for writing them a few at a time, not a bug. If you are
  an agent reading this: do not fill these in unless you were explicitly asked
  to write copy.
- Scope follows the view. Looking at a diner evaluates `scope: "diner"`,
  looking at the table evaluates `scope: "table"` over every owner's plates
  pooled together.
- When several notes qualify, highest `weight` wins; ties break by array order.
  Only ever one note on screen.
- `id` is the identity for firing. Renaming an id re-arms that note, so don't
  recycle one for a new meaning.
- Elapsed and idle minutes arrive through the context, never read from the
  clock inside the module — that is what keeps it testable under node and keeps
  `Date.now()` out of anything the reducer can see. The component stamps
  `openedAt` / `lastFillAt` in refs and ticks a 20s interval so idle notes
  re-evaluate; the interval only runs while a session has plates on it.
- A throwing predicate is caught and treated as not-qualifying. A bad note must
  never take the board down.
- `.gx-desk` follows the same reduced-motion rule as the easter eggs: base
  state is visible at rest and the keyframes only add motion.

## Voice

Deadpan trading-desk. Dry, short, never zany. The joke is that it takes an
absurd premise completely seriously. Labels are trading vocabulary ("Position",
"Cover / person", "Filled"). Verdict lines are one sentence and land on an
image, not a punchline — "The manager knows your face," not "LOL you ate so
much!!" No exclamation marks anywhere in the UI.

That rule governs the **chrome**: labels, verdict lines, soju asides, buttons,
the receipt. It is the app's default register and new copy should match it.

**Two places deliberately break it. Neither is a mistake to fix.**

*The 6mildil easter egg* in `easterEggs.js` is enthusiastic and ends in an
exclamation mark. That is the joke — the desk drops its composure for exactly
one person, which only works because the chrome never does. Do not normalise
its punctuation.

*Analyst notes* in `analyst.js` are a second register on purpose: this is King
talking to his friends over the top of the board, not the desk reporting. They
are warm, chatty, second-person, sometimes signed, and they use exclamation
marks and capitals freely. That contrast against the deadpan chrome is the
point — the numbers stay clinical while the commentary heckles you.

**If you are an agent: do not rewrite, tone down, or "fix the voice" of any
`line:` in `analyst.js`.** Every one of them is hand-authored. Do not fill in
the blank ones either — an empty `line` is a disabled note, not an oversight.
Edit those strings only when King explicitly asks for copy. Predicates,
weights, and wiring are fair game as normal code.

## Easter eggs

Naming a party member `6mildil` (case-insensitive, whitespace-trimmed) pops a
message and fires confetti, and marks their chip with a mic and an ember glow.

- Fires on the *transition* into being famous, tracked per person id. Renaming
  away drops them from the set, so renaming back fires again. Two people can
  both be famous; each triggers once.
- `confettiBurst()` returns a cancel function. The component calls it on
  unmount and before starting a new burst, so canvases never pile up.
- Both the confetti and the message respect `prefers-reduced-motion`: the
  burst becomes a no-op, and the card's base state is deliberately visible
  (opacity 1, no transform) so stripping the animation still leaves it
  readable. Never move that reveal into the keyframes only.

**Soju watch.** Five soju across the whole table — every diner plus the shared
bucket — drops a dry aside at the bottom of the screen. Escalates at 8 and 12.

- These lines stay in house voice, unlike the 6mildil one. A deadpan safety
  question is funnier than an enthusiastic one, and the joke must never read
  as cheering the table on. Keep it that way if you add a tier.
- Each tier fires once. Going 8 -> 7 -> 8 does not re-fire, so tapping minus
  and plus can't spam it; dropping under 5 re-arms everything.
- Same reduced-motion rule as above: `.gx-aside` is visible at rest and the
  animation only adds motion.

## Open decisions (unbuilt, roughly in priority order)

1. ~~**Shareable receipt.**~~ Done Aug 2026. `receipt.js` draws a settlement to
   a canvas and hands back a PNG; the app offers Web Share (falls back to
   clipboard, then download). Canvas rather than `html-to-image` so the zero-
   dependency stance holds and the share image can use a fixed portrait layout
   instead of fighting the responsive one. Callers must await `fontsReady()`
   first or it renders in Times.
2. **Persistence + history.** Currently session-only. Saving meals unlocks the
   interesting version: lifetime P&L, win rate, best table ever. Needs a
   storage layer; `localStorage` is fine to start.
3. **Restaurant profiles.** Cover charges vary a lot by city. A saved list
   beats retyping the cover every time. Depends on (2).
4. ~~**Recalibrate `menu.js` against real menus.**~~ Done Aug 2026. Values are
   now derived from real a-la-carte menus and published AYCE portion sizes
   rather than guessed; verdict ceilings were stretched to match the honest
   distribution. Revisit if you eat somewhere the numbers feel wrong.

## Not yet decided

- Whether this stays a single-page toy or gets a backend.
- ~~Whether "diners" should pool one shared log or track per-person columns.~~
  Resolved Aug 2026: per-person, with a `TABLE` bucket for genuinely shared
  plates. The UI cost was one chip row and an active-owner selector.
- Whether drinks should count toward `paid` as well as `eaten`. You buy them
  on top of the cover, so logging one is currently pure upside, which is
  wrong. Fixing it means `paid` stops being `cover * diners`.
