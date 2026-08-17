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
| `src/menu.js` | All menu data, category ordering, verdict tiers. The only file you touch to retune values or add items. |
| `src/GrillExchange.jsx` | The single component. All state, all math, all markup. |
| `src/GrillExchange.css` | All styling, scoped under `.gx-root`. |
| `src/main.jsx` | Entry point. |

State lives in one component: `counts` (an `{itemId: n}` map), plus `cover`,
`diners`, `minutes`, `mode`. Everything else is derived in `useMemo`. If this
grows past ~2 more features, `counts` should move to a `useReducer` before it
gets tangled — not before.

## Domain notes

- `v` on each item is **the value of one AYCE-sized plate**, not the full
  a-la-carte menu price. AYCE portions are ~60-70% of a menu plate. Using menu
  prices puts everyone at 3x and the app stops discriminating between diners.
  This is the biggest source of error in the whole thing.
- `ratio = eaten / paid` drives everything: the verdict tier, the color tone,
  the progress bar. Break-even is 1.0.
- Mode tabs filter which items are *visible*; they do not reset `counts`.
  Combo KBBQ+hotpot restaurants exist and switching tabs shouldn't wipe a log.
- `VERDICTS` must stay sorted ascending by `max` — lookup takes the first match.
- `tone` (`loss` / `flat` / `win`) is the color system. Adding a tier means
  picking one of those three, not inventing a fourth color.

## Voice

Deadpan trading-desk. Dry, short, never zany. The joke is that it takes an
absurd premise completely seriously. Labels are trading vocabulary ("Position",
"Cover / person", "Filled"). Verdict lines are one sentence and land on an
image, not a punchline — "The manager knows your face," not "LOL you ate so
much!!" No exclamation marks anywhere in the UI.

## Open decisions (unbuilt, roughly in priority order)

1. **Shareable receipt.** Render the verdict card to an image so it can go in
   a group chat. Highest leverage — this is the part people would actually
   send to someone. Probably `html-to-image` or a canvas draw.
2. **Persistence + history.** Currently session-only. Saving meals unlocks the
   interesting version: lifetime P&L, win rate, best table ever. Needs a
   storage layer; `localStorage` is fine to start.
3. **Restaurant profiles.** Cover charges vary a lot by city. A saved list
   beats retyping the cover every time. Depends on (2).
4. **Recalibrate `menu.js` against real menus.** Should honestly happen before
   any of the above — right now every value is an educated guess.

## Not yet decided

- Whether this stays a single-page toy or gets a backend.
- Whether "diners" should pool one shared log (current behavior) or track
  per-person columns. Per-person is more accurate for splitting blame but a
  lot more UI.
