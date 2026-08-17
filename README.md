# The Grill Exchange

An all-you-can-eat KBBQ / hot pot value calculator. Log what you ate, find out
whether you beat the house.

Your dinner, scored as a trading position: the cover charge is what you paid to
open, every plate is value recovered, and the board goes green when you're up.

## Run it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. The dev server binds to `0.0.0.0`, so you can
also pull it up on your phone at `http://<your-lan-ip>:5173` — which is where
this actually gets used.

## Tuning the values

Everything lives in `src/menu.js`. Each item's `v` is what one AYCE-sized plate
would cost à la carte — roughly 60-70% of the full menu price, since AYCE
portions are smaller. Retune these against menus you actually eat at; the
defaults are educated guesses at US mid-range pricing.

## Stack

Vite + React 18. No dependencies beyond that. Plain CSS.

See `CLAUDE.md` for architecture notes and what's not built yet.
