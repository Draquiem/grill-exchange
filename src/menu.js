/**
 * MENU DATA
 *
 * `v` = the RAW MARKET COST of one round of this item. Not the à-la-carte
 * menu price, not an AYCE-plate equivalent — what the food itself is worth
 * at retail, per pound, today.
 *
 * MARK-TO-MARKET (Aug 2026)
 * -------------------------
 * This file used to price a plate at what a restaurant would charge for it
 * à la carte. It no longer does. The board now marks your dinner against the
 * commodity, which is a different and much harsher question: not "did I beat
 * the menu price" but "what is the meat actually worth."
 *
 * The conversion is a portion times a price per pound:
 *
 *   v = pricePerLb * lb          lb = 0.5 for meat & seafood
 *                                     0.25 for vegetables & carbs
 *
 * where, for anything BLS publishes, pricePerLb is a live figure pulled at
 * runtime (see market.js) times a per-cut multiplier `k`:
 *
 *   pricePerLb = market[anchor] * k
 *
 * `k` positions a specific cut against its BLS aggregate — ribeye trades
 * above the all-steaks average, brisket below the all-other-beef average.
 * The multipliers are retail spreads, not guesses, and they are the ONLY
 * hand-set number in a market-linked item.
 *
 * WHAT IS AND IS NOT LIVE
 * -----------------------
 * BLS covers beef, pork and chicken well. It publishes NOTHING usable for
 * lamb, for seafood, or for the Asian produce this menu runs on — no enoki,
 * no napa, no bok choy. Those items carry a hand-set `v` at raw retail cost
 * and are flagged `est: true`, which the UI marks on the card. Do not invent
 * an anchor for them by borrowing a beef series; a wrong source is worse than
 * an honest estimate.
 *
 * Drinks stay at full menu price. You buy them on top of the cover, so they
 * were never a commodity question — see the open item in CLAUDE.md.
 *
 * Sanity check these against: a diner needs roughly six to seven premium
 * rounds to clear a $35 cover, four rounds plus a side lands near 0.7x, and
 * fourteen rounds passes 2.5x. Break-even is genuinely hard now, because a
 * cover buys labour, rent, banchan and the grill — not just protein.
 * If a retune breaks that spread, the spread is right and the retune is wrong.
 *
 * Fields:
 *   id   unique key (used in the counts map — don't reuse across items)
 *   e    emoji
 *   n    English name
 *   cat  category — must exist in CAT_ORDER for every menu it appears in
 *   m    which menus it shows up on: "kbbq", "hotpot", or both
 *   lb   pounds in one round (0.5 meat/seafood, 0.25 veg/carbs)
 *   mk   { a, k } market link: anchor key in market.js, and the cut multiplier
 *   v    price in USD — computed from `mk` when present, otherwise hand-set
 *   est  true when `v` is a hand-set estimate rather than a live figure
 */

import { ANCHORS, fallbackMarket } from "./market.js";

/** Pounds per round, by kind. Meat and seafood eat twice what produce does. */
export const PORTION = { meat: 0.5, veg: 0.25 };

export const ITEMS = [
  // --- KBBQ: BEEF ---
  { id: "brisket", e: "🥩", n: "Brisket", cat: "Beef", m: ["kbbq"], lb: 0.5, mk: { a: "BEEF_OTHER", k: 0.95 } },
  { id: "galbi", e: "🍖", n: "Short Rib", cat: "Beef", m: ["kbbq"], lb: 0.5, mk: { a: "BEEF_OTHER", k: 1.45 } },
  { id: "ribeye", e: "🥩", n: "Ribeye", cat: "Beef", m: ["kbbq"], lb: 0.5, mk: { a: "BEEF_STEAK", k: 1.35 } },
  { id: "bulgogi", e: "🐂", n: "Bulgogi", cat: "Beef", m: ["kbbq"], lb: 0.5, mk: { a: "BEEF_STEAK", k: 0.8 } },
  { id: "tongue", e: "👅", n: "Beef Tongue", cat: "Beef", m: ["kbbq"], lb: 0.5, mk: { a: "BEEF_OTHER", k: 1.1 } },

  // --- KBBQ: PORK ---
  // Bacon is the BLS series for cured pork belly, which is the closest real
  // anchor a fresh belly has. k nudges it back to uncured.
  { id: "samgyup", e: "🥓", n: "Pork Belly", cat: "Pork", m: ["kbbq"], lb: 0.5, mk: { a: "PORK_BELLY", k: 1.05 } },
  { id: "spicypork", e: "🌶️", n: "Spicy Pork", cat: "Pork", m: ["kbbq"], lb: 0.5, mk: { a: "PORK_CHOP", k: 1.0 } },
  { id: "jowl", e: "🐖", n: "Pork Jowl", cat: "Pork", m: ["kbbq"], lb: 0.5, mk: { a: "PORK_OTHER", k: 1.35 } },

  // --- KBBQ: CHICKEN ---
  { id: "thigh", e: "🍗", n: "Chicken Thigh", cat: "Chicken", m: ["kbbq"], lb: 0.5, mk: { a: "CHICKEN_LEG", k: 1.25 } },
  { id: "spicychx", e: "🔥", n: "Spicy Chicken", cat: "Chicken", m: ["kbbq"], lb: 0.5, mk: { a: "CHICKEN_LEG", k: 1.25 } },

  // --- HOTPOT: MEAT ---
  // No BLS lamb series exists at any granularity — hand-set at retail.
  { id: "lambroll", e: "🐑", n: "Lamb Roll", cat: "Meat", m: ["hotpot"], lb: 0.5, v: 6.0, est: true },
  { id: "beefroll", e: "🥩", n: "Beef Roll", cat: "Meat", m: ["hotpot"], lb: 0.5, mk: { a: "BEEF_STEAK", k: 0.85 } },
  { id: "marbled", e: "❄️", n: "Marbled Ribeye", cat: "Meat", m: ["hotpot"], lb: 0.5, mk: { a: "BEEF_STEAK", k: 1.35 } },
  { id: "porkroll", e: "🥓", n: "Pork Belly Roll", cat: "Meat", m: ["hotpot"], lb: 0.5, mk: { a: "PORK_BELLY", k: 1.05 } },

  // --- SEAFOOD (shared + hotpot-only) --- BLS publishes no seafood series.
  { id: "shrimp", e: "🍤", n: "Shrimp", cat: "Seafood", m: ["kbbq", "hotpot"], lb: 0.5, v: 4.5, est: true },
  { id: "squid", e: "🦑", n: "Squid", cat: "Seafood", m: ["kbbq", "hotpot"], lb: 0.5, v: 3.0, est: true },
  { id: "scallop", e: "🐚", n: "Scallop", cat: "Seafood", m: ["kbbq", "hotpot"], lb: 0.5, v: 10.0, est: true },
  { id: "fishball", e: "🐟", n: "Fish Balls", cat: "Seafood", m: ["hotpot"], lb: 0.5, v: 2.5, est: true },
  { id: "mussel", e: "🦪", n: "Mussels", cat: "Seafood", m: ["hotpot"], lb: 0.5, v: 2.5, est: true },
  { id: "crabstick", e: "🦀", n: "Crab Stick", cat: "Seafood", m: ["hotpot"], lb: 0.5, v: 2.0, est: true },

  // --- HOTPOT: VEG --- quarter pound a round, and produce is cheap. This is
  // the category that makes the raw-cost framing land: a $35 cover buys a
  // truly absurd amount of napa.
  { id: "enoki", e: "🍄", n: "Enoki", cat: "Vegetables", m: ["hotpot"], lb: 0.25, v: 1.25, est: true },
  { id: "napa", e: "🥬", n: "Napa Cabbage", cat: "Vegetables", m: ["hotpot"], lb: 0.25, v: 0.38, est: true },
  { id: "bokchoy", e: "🌿", n: "Bok Choy", cat: "Vegetables", m: ["hotpot"], lb: 0.25, v: 0.5, est: true },
  { id: "taro", e: "🍠", n: "Taro", cat: "Vegetables", m: ["hotpot"], lb: 0.25, v: 0.63, est: true },
  { id: "corn", e: "🌽", n: "Corn", cat: "Vegetables", m: ["hotpot"], lb: 0.25, v: 0.38, est: true },
  { id: "mushmix", e: "🍄", n: "Mushroom Mix", cat: "Vegetables", m: ["hotpot"], lb: 0.25, v: 1.25, est: true },

  // --- HOTPOT: CARBS --- priced as produce: a quarter pound a round.
  { id: "noodles", e: "🍜", n: "Hand-pulled Noodles", cat: "Carbs", m: ["hotpot"], lb: 0.25, v: 0.75, est: true },
  { id: "glassnoodle", e: "🍝", n: "Glass Noodles", cat: "Carbs", m: ["hotpot"], lb: 0.25, v: 1.0, est: true },
  { id: "dumpling", e: "🥟", n: "Dumplings", cat: "Carbs", m: ["hotpot"], lb: 0.25, v: 1.25, est: true },
  { id: "tofu", e: "🍮", n: "Tofu", cat: "Carbs", m: ["hotpot"], lb: 0.25, v: 0.5, est: true },
  { id: "ricecake", e: "🍢", n: "Rice Cake", cat: "Carbs", m: ["hotpot"], lb: 0.25, v: 0.75, est: true },

  // --- KBBQ: SIDES --- prepared dishes, so this is ingredient cost, which is
  // most of the joke: the kimchi pancake is flour.
  { id: "pancake", e: "🥞", n: "Kimchi Pancake", cat: "Sides", m: ["kbbq"], v: 1.5, est: true },
  { id: "eggsouffle", e: "🍳", n: "Steamed Egg", cat: "Sides", m: ["kbbq"], v: 0.75, est: true },
  { id: "japchae", e: "🍲", n: "Japchae", cat: "Sides", m: ["kbbq"], v: 1.75, est: true },
  { id: "cornCheese", e: "🧀", n: "Corn Cheese", cat: "Sides", m: ["kbbq"], v: 1.25, est: true },
  { id: "rice", e: "🍚", n: "Rice", cat: "Sides", m: ["kbbq"], v: 0.3, est: true },

  // --- DRINKS (shared) ---
  // Full menu price, not commodity cost: alcohol is essentially never inside
  // the AYCE cover, so you pay it on top. See CLAUDE.md, "Not yet decided".
  { id: "soju", e: "🍶", n: "Soju", cat: "Drinks", m: ["kbbq", "hotpot"], v: 14, menu: true },
  { id: "beer", e: "🍺", n: "Beer", cat: "Drinks", m: ["kbbq", "hotpot"], v: 8, menu: true },
  { id: "boba", e: "🧋", n: "Boba", cat: "Drinks", m: ["kbbq", "hotpot"], v: 6, menu: true },
  { id: "soda", e: "🥤", n: "Soda", cat: "Drinks", m: ["kbbq", "hotpot"], v: 3, menu: true },
];

/**
 * Resolve every item's `v` against a market snapshot.
 *
 * Pure: same snapshot in, same prices out — the component memoises on it and
 * the reducer never sees a moving number. Items without `mk` pass straight
 * through with their hand-set `v`.
 */
export function priceItems(market) {
  const snap = market || fallbackMarket();
  return ITEMS.map((it) => {
    if (!it.mk) return it;
    const anchor = ANCHORS[it.mk.a];
    const perLb = anchor ? snap.prices[anchor.id] : undefined;
    if (!perLb) return { ...it, est: true };
    return { ...it, v: perLb * it.mk.k * it.lb, perLb: perLb * it.mk.k };
  });
}

/** Render order of categories per menu. Categories not listed here won't show. */
export const CAT_ORDER = {
  kbbq: ["Beef", "Pork", "Chicken", "Seafood", "Sides", "Drinks"],
  hotpot: ["Meat", "Seafood", "Vegetables", "Carbs", "Drinks"],
};

/**
 * Verdict tiers, keyed on ratio = market value eaten / total paid.
 * First entry whose `max` exceeds the ratio wins, so keep this sorted ascending.
 * `tone` drives the color system: loss (ember) / flat (amber) / win (scallion).
 *
 * Break-even stays pinned at 1.0 — that is the definition of the word and it
 * does not move. The tiers around it compressed (Aug 2026) when the board went
 * mark-to-market: against raw commodity cost the whole distribution shifts
 * down, because a cover charge is mostly not protein. Beating the house is now
 * genuinely hard rather than the normal outcome, which is the honest result and
 * the reason the top tier is worth reaching.
 */
export const VERDICTS = [
  {
    max: 0.45,
    t: "House Sponsor",
    s: "You are personally covering their rent this month. They appreciate it.",
    tone: "loss",
  },
  {
    max: 0.85,
    t: "Light Grazer",
    s: "Dignified. Also you left real money sitting on that grill.",
    tone: "loss",
  },
  {
    max: 1.15,
    t: "Break Even",
    s: "Nobody won. Nobody lost. The most disappointing outcome available.",
    tone: "flat",
  },
  {
    max: 1.7,
    t: "In The Green",
    s: "You beat the house on raw cost. Leave calmly. Do not make eye contact.",
    tone: "win",
  },
  {
    max: 2.4,
    t: "Margin Menace",
    s: "The server stopped smiling twenty minutes ago. The manager knows your face.",
    tone: "win",
  },
  {
    max: Infinity,
    t: "Why The Time Limit Exists",
    s: "Policy is being rewritten tonight. It will quietly be named after you.",
    tone: "win",
  },
];
