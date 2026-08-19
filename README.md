# The Grill Exchange

An all-you-can-eat KBBQ / hot pot value calculator. Log what you ate, find out
whether you beat the house.

Your dinner, scored as a trading position: the cover charge is what you paid to
open, every plate is value recovered, and the board goes green when you're up.

Add everyone at the table, log each plate against whoever actually ate it, and
every diner gets their own P&L and verdict. Plates the whole table picked at go
to a shared bucket and split evenly. When the meal is done, "Settle up" draws a
receipt you can share straight into the group chat.

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
would cost à la carte. An AYCE plate is 3-4 oz of protein against an 8-16 oz
à-la-carte order, so that works out to 22-45% of the menu price depending on
the cut — the method and the menus it was derived from are documented at the
top of `menu.js`. Retune against the places you actually eat at.

## Stack

Vite + React 18. No dependencies beyond that. Plain CSS. The shareable receipt
is drawn on a canvas by hand rather than pulling in an html-to-image library.

The party reducer and all per-person money math live in `src/party.js`, which
imports nothing and can be exercised straight from node.

See `CLAUDE.md` for architecture notes and what's not built yet.
