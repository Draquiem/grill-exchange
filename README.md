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

## Where the prices come from

The board is marked to market. An item's value is the raw retail cost of the
food itself — half a pound of meat or seafood per round, a quarter pound of
vegetables or carbs — not what a restaurant would charge for it.

For beef, pork and chicken those per-pound prices are pulled live from the US
Bureau of Labor Statistics Average Price Data survey, which is public, keyless,
and updates monthly. The masthead shows which month you're looking at. Cuts BLS
doesn't publish — lamb, seafood, and every Asian vegetable on the hot pot menu
— carry a hand-set retail estimate and are marked with a small `e` on the card.

Nothing is simulated. If a number is on the board, either BLS published it or
it's flagged as an estimate.

**Using it with a group?** Get a free BLS key. Without one you're on the
unregistered tier — 25 requests a day counted per IP — and since the price
cache is per browser and each refresh spends six requests, a table of five on
the same wifi runs out before the food arrives. A key raises that to 500/day:

```
cp .env.example .env.local     # then paste your key
```

Grab one at <https://data.bls.gov/registrationEngine/> — free, instant, email
only. The app works fine without it; it just falls back to the baked-in prices
and says so in the masthead. The anchors and per-cut multipliers are documented
at the top of `src/menu.js`; the fetch, cache and offline fallback live in
`src/market.js`.

Because you're now being measured against grocery cost rather than menu price,
break-even is genuinely hard: a cover charge buys labour, rent, banchan and the
grill, and only some of it is protein. Roughly six or seven premium rounds
clears a $35 cover.

## Stack

Vite + React 18. No dependencies beyond that. Plain CSS. The shareable receipt
is drawn on a canvas by hand rather than pulling in an html-to-image library.

The party reducer and all per-person money math live in `src/party.js`, which
imports nothing and can be exercised straight from node.

See `CLAUDE.md` for architecture notes and what's not built yet.
