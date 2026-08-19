/**
 * MENU DATA
 *
 * `v` = what ONE AYCE-SIZED PLATE of this item would cost a la carte.
 * This is deliberately NOT the full a-la-carte menu price.
 *
 * CALIBRATION METHOD (Aug 2026)
 * -----------------------------
 * An AYCE plate is 3-4 oz of protein. An a-la-carte order is 8 oz for most
 * cuts, 10-12 oz for galbi, 16 oz for ribeye and pork jowl. So the honest
 * conversion is NOT a flat 60-70% — it is a-la-carte price per ounce times a
 * 3.5 oz plate, which lands between 22% and 45% depending on the cut. The
 * old flat-70% assumption is what put every diner at 3x.
 *
 *   v = (a-la-carte price / a-la-carte ounces) * 3.5
 *
 * Anchors used:
 *   KBBQ a-la-carte, US mid-range 2026 — brisket $26-32/8oz, galbi $34-54/
 *   10-12oz, ribeye $45/16oz, tongue $33/8oz, pork belly $25-30/8-9oz,
 *   pork jowl $37/16oz, bulgogi $30/8oz, chicken $23/8oz.
 *   Hot pot a-la-carte — Haidilao US list: prime ribeye $19.98, short rib
 *   $13.98, lamb shoulder $14.98, scallop $16.98, enoki $6.98, napa $5.98,
 *   tofu $5.98, rice cake $4.98, egg noodles $3.98.
 *   Hot pot plates run closer to the a-la-carte portion than KBBQ plates do,
 *   so meats there take ~0.7 and produce/carbs ~0.75 rather than a per-ounce
 *   split.
 *
 * Relative spread follows true cut value (ribeye ~ short rib > tongue >
 * brisket ~ bulgogi > belly ~ jowl > chicken), NOT raw per-ounce extraction —
 * the big-format cuts price down per ounce purely because the a-la-carte
 * order is bigger, which is a portioning artifact, not a value signal.
 *
 * Sanity check these against: 4 meat plates + a side should land a median
 * diner near 1.6x, two plates should land under 0.8x, eight plates past 3x.
 * If a retune breaks that spread, the spread is right and the retune is wrong.
 *
 * Fields:
 *   id   unique key (used in the counts map — don't reuse across items)
 *   e    emoji
 *   n    English name
 *   v    plate value in USD
 *   cat  category — must exist in CAT_ORDER for every menu it appears in
 *   m    which menus it shows up on: "kbbq", "hotpot", or both
 */

export const ITEMS = [
  // --- KBBQ: BEEF ---
  { id: "brisket", e: "🥩", n: "Brisket", v: 12, cat: "Beef", m: ["kbbq"] },
  { id: "galbi", e: "🍖", n: "Short Rib", v: 15, cat: "Beef", m: ["kbbq"] },
  { id: "ribeye", e: "🥩", n: "Ribeye", v: 15, cat: "Beef", m: ["kbbq"] },
  { id: "bulgogi", e: "🐂", n: "Bulgogi", v: 12, cat: "Beef", m: ["kbbq"] },
  { id: "tongue", e: "👅", n: "Beef Tongue", v: 14, cat: "Beef", m: ["kbbq"] },

  // --- KBBQ: PORK ---
  { id: "samgyup", e: "🥓", n: "Pork Belly", v: 11, cat: "Pork", m: ["kbbq"] },
  { id: "spicypork", e: "🌶️", n: "Spicy Pork", v: 10, cat: "Pork", m: ["kbbq"] },
  { id: "jowl", e: "🐖", n: "Pork Jowl", v: 11, cat: "Pork", m: ["kbbq"] },

  // --- KBBQ: CHICKEN ---
  { id: "thigh", e: "🍗", n: "Chicken Thigh", v: 8, cat: "Chicken", m: ["kbbq"] },
  { id: "spicychx", e: "🔥", n: "Spicy Chicken", v: 8, cat: "Chicken", m: ["kbbq"] },

  // --- HOTPOT: MEAT ---
  { id: "lambroll", e: "🐑", n: "Lamb Roll", v: 10, cat: "Meat", m: ["hotpot"] },
  { id: "beefroll", e: "🥩", n: "Beef Roll", v: 10, cat: "Meat", m: ["hotpot"] },
  { id: "marbled", e: "❄️", n: "Marbled Ribeye", v: 14, cat: "Meat", m: ["hotpot"] },
  { id: "porkroll", e: "🥓", n: "Pork Belly Roll", v: 9, cat: "Meat", m: ["hotpot"] },

  // --- SEAFOOD (shared + hotpot-only) ---
  { id: "shrimp", e: "🍤", n: "Shrimp", v: 9, cat: "Seafood", m: ["kbbq", "hotpot"] },
  { id: "squid", e: "🦑", n: "Squid", v: 6, cat: "Seafood", m: ["kbbq", "hotpot"] },
  { id: "scallop", e: "🐚", n: "Scallop", v: 12, cat: "Seafood", m: ["kbbq", "hotpot"] },
  { id: "fishball", e: "🐟", n: "Fish Balls", v: 6, cat: "Seafood", m: ["hotpot"] },
  { id: "mussel", e: "🦪", n: "Mussels", v: 7, cat: "Seafood", m: ["hotpot"] },
  { id: "crabstick", e: "🦀", n: "Crab Stick", v: 4, cat: "Seafood", m: ["hotpot"] },

  // --- HOTPOT: VEG ---
  { id: "enoki", e: "🍄", n: "Enoki", v: 5, cat: "Vegetables", m: ["hotpot"] },
  { id: "napa", e: "🥬", n: "Napa Cabbage", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "bokchoy", e: "🌿", n: "Bok Choy", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "taro", e: "🍠", n: "Taro", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "corn", e: "🌽", n: "Corn", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "mushmix", e: "🍄", n: "Mushroom Mix", v: 5, cat: "Vegetables", m: ["hotpot"] },

  // --- HOTPOT: CARBS ---
  { id: "noodles", e: "🍜", n: "Hand-pulled Noodles", v: 4, cat: "Carbs", m: ["hotpot"] },
  { id: "glassnoodle", e: "🍝", n: "Glass Noodles", v: 4, cat: "Carbs", m: ["hotpot"] },
  { id: "dumpling", e: "🥟", n: "Dumplings", v: 5, cat: "Carbs", m: ["hotpot"] },
  { id: "tofu", e: "🍮", n: "Tofu", v: 4, cat: "Carbs", m: ["hotpot"] },
  { id: "ricecake", e: "🍢", n: "Rice Cake", v: 4, cat: "Carbs", m: ["hotpot"] },

  // --- KBBQ: SIDES ---
  // AYCE sides come out in ramekins, not the full a-la-carte plate — ~0.45.
  { id: "pancake", e: "🥞", n: "Kimchi Pancake", v: 9, cat: "Sides", m: ["kbbq"] },
  { id: "eggsouffle", e: "🍳", n: "Steamed Egg", v: 6, cat: "Sides", m: ["kbbq"] },
  { id: "japchae", e: "🍲", n: "Japchae", v: 10, cat: "Sides", m: ["kbbq"] },
  { id: "cornCheese", e: "🧀", n: "Corn Cheese", v: 6, cat: "Sides", m: ["kbbq"] },
  { id: "rice", e: "🍚", n: "Rice", v: 2, cat: "Sides", m: ["kbbq"] },

  // --- DRINKS (shared) ---
  // NOTE: alcohol is almost never inside the AYCE cover — see CLAUDE.md.
  // These are full menu prices because you pay them on top of the cover.
  { id: "soju", e: "🍶", n: "Soju", v: 14, cat: "Drinks", m: ["kbbq", "hotpot"] },
  { id: "beer", e: "🍺", n: "Beer", v: 8, cat: "Drinks", m: ["kbbq", "hotpot"] },
  { id: "boba", e: "🧋", n: "Boba", v: 6, cat: "Drinks", m: ["kbbq", "hotpot"] },
  { id: "soda", e: "🥤", n: "Soda", v: 3, cat: "Drinks", m: ["kbbq", "hotpot"] },
];

/** Render order of categories per menu. Categories not listed here won't show. */
export const CAT_ORDER = {
  kbbq: ["Beef", "Pork", "Chicken", "Seafood", "Sides", "Drinks"],
  hotpot: ["Meat", "Seafood", "Vegetables", "Carbs", "Drinks"],
};

/**
 * Verdict tiers, keyed on ratio = value eaten / total paid.
 * First entry whose `max` exceeds the ratio wins, so keep this sorted ascending.
 * `tone` drives the color system: loss (ember) / flat (amber) / win (scallion).
 *
 * Break-even stays pinned at 1.0 — that is the definition of the word and it
 * does not move. What moved (Aug 2026) is the ceiling: against honest plate
 * values a median diner lands near 1.6x, because a-la-carte KBBQ is marked up
 * far harder than AYCE is. Beating the house is genuinely the normal outcome,
 * so the top tiers stretch out to leave the real gluttons somewhere to go.
 */
export const VERDICTS = [
  {
    max: 0.6,
    t: "House Sponsor",
    s: "You are personally covering their rent this month. They appreciate it.",
    tone: "loss",
  },
  {
    max: 0.95,
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
    max: 1.9,
    t: "In The Green",
    s: "You beat the house. Leave calmly. Do not make eye contact.",
    tone: "win",
  },
  {
    max: 2.8,
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
