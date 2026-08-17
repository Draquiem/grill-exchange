/**
 * MENU DATA
 *
 * `v` = what ONE AYCE-SIZED PLATE of this item would cost a la carte.
 * This is deliberately NOT the full a-la-carte menu price — AYCE portions
 * run roughly 60-70% of a menu plate. Using full menu prices makes every
 * diner land at 3x and the whole app stops meaning anything.
 *
 * Current numbers are eyeballed against US mid-range pricing. They are the
 * single biggest source of error in this app. Recalibrate against real menus.
 *
 * Fields:
 *   id   unique key (used in the counts map — don't reuse across items)
 *   e    emoji
 *   n    English name
 *   sub  native-script name (KR / CN)
 *   v    plate value in USD
 *   cat  category — must exist in CAT_ORDER for every menu it appears in
 *   m    which menus it shows up on: "kbbq", "hotpot", or both
 */

export const ITEMS = [
  // --- KBBQ: BEEF ---
  { id: "brisket", e: "🥩", n: "Brisket", sub: "차돌박이", v: 14, cat: "Beef", m: ["kbbq"] },
  { id: "galbi", e: "🍖", n: "Short Rib", sub: "갈비", v: 24, cat: "Beef", m: ["kbbq"] },
  { id: "ribeye", e: "🥩", n: "Ribeye", sub: "꽃등심", v: 22, cat: "Beef", m: ["kbbq"] },
  { id: "bulgogi", e: "🐂", n: "Bulgogi", sub: "불고기", v: 16, cat: "Beef", m: ["kbbq"] },
  { id: "tongue", e: "👅", n: "Beef Tongue", sub: "우설", v: 20, cat: "Beef", m: ["kbbq"] },

  // --- KBBQ: PORK ---
  { id: "samgyup", e: "🥓", n: "Pork Belly", sub: "삼겹살", v: 15, cat: "Pork", m: ["kbbq"] },
  { id: "spicypork", e: "🌶️", n: "Spicy Pork", sub: "제육", v: 14, cat: "Pork", m: ["kbbq"] },
  { id: "jowl", e: "🐖", n: "Pork Jowl", sub: "항정살", v: 16, cat: "Pork", m: ["kbbq"] },

  // --- KBBQ: CHICKEN ---
  { id: "thigh", e: "🍗", n: "Chicken Thigh", sub: "닭다리살", v: 12, cat: "Chicken", m: ["kbbq"] },
  { id: "spicychx", e: "🔥", n: "Spicy Chicken", sub: "매운닭", v: 12, cat: "Chicken", m: ["kbbq"] },

  // --- HOTPOT: MEAT ---
  { id: "lambroll", e: "🐑", n: "Lamb Roll", sub: "羊肉卷", v: 13, cat: "Meat", m: ["hotpot"] },
  { id: "beefroll", e: "🥩", n: "Beef Roll", sub: "肥牛卷", v: 14, cat: "Meat", m: ["hotpot"] },
  { id: "marbled", e: "❄️", n: "Marbled Ribeye", sub: "雪花牛", v: 20, cat: "Meat", m: ["hotpot"] },
  { id: "porkroll", e: "🥓", n: "Pork Belly Roll", sub: "五花肉", v: 12, cat: "Meat", m: ["hotpot"] },

  // --- SEAFOOD (shared + hotpot-only) ---
  { id: "shrimp", e: "🍤", n: "Shrimp", sub: "새우 · 虾", v: 14, cat: "Seafood", m: ["kbbq", "hotpot"] },
  { id: "squid", e: "🦑", n: "Squid", sub: "오징어 · 鱿鱼", v: 12, cat: "Seafood", m: ["kbbq", "hotpot"] },
  { id: "scallop", e: "🐚", n: "Scallop", sub: "가리비 · 扇贝", v: 18, cat: "Seafood", m: ["kbbq", "hotpot"] },
  { id: "fishball", e: "🐟", n: "Fish Balls", sub: "鱼丸", v: 8, cat: "Seafood", m: ["hotpot"] },
  { id: "mussel", e: "🦪", n: "Mussels", sub: "青口", v: 12, cat: "Seafood", m: ["hotpot"] },
  { id: "crabstick", e: "🦀", n: "Crab Stick", sub: "蟹柳", v: 7, cat: "Seafood", m: ["hotpot"] },

  // --- HOTPOT: VEG ---
  { id: "enoki", e: "🍄", n: "Enoki", sub: "金针菇", v: 5, cat: "Vegetables", m: ["hotpot"] },
  { id: "napa", e: "🥬", n: "Napa Cabbage", sub: "白菜", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "bokchoy", e: "🌿", n: "Bok Choy", sub: "青菜", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "taro", e: "🍠", n: "Taro", sub: "芋头", v: 5, cat: "Vegetables", m: ["hotpot"] },
  { id: "corn", e: "🌽", n: "Corn", sub: "玉米", v: 4, cat: "Vegetables", m: ["hotpot"] },
  { id: "mushmix", e: "🍄", n: "Mushroom Mix", sub: "菌菇拼盘", v: 6, cat: "Vegetables", m: ["hotpot"] },

  // --- HOTPOT: CARBS ---
  { id: "noodles", e: "🍜", n: "Hand-pulled Noodles", sub: "拉面", v: 7, cat: "Carbs", m: ["hotpot"] },
  { id: "glassnoodle", e: "🍝", n: "Glass Noodles", sub: "粉丝", v: 5, cat: "Carbs", m: ["hotpot"] },
  { id: "dumpling", e: "🥟", n: "Dumplings", sub: "饺子", v: 9, cat: "Carbs", m: ["hotpot"] },
  { id: "tofu", e: "🍮", n: "Tofu", sub: "豆腐", v: 5, cat: "Carbs", m: ["hotpot"] },
  { id: "ricecake", e: "🍢", n: "Rice Cake", sub: "年糕", v: 6, cat: "Carbs", m: ["hotpot"] },

  // --- KBBQ: SIDES ---
  { id: "pancake", e: "🥞", n: "Kimchi Pancake", sub: "김치전", v: 12, cat: "Sides", m: ["kbbq"] },
  { id: "eggsouffle", e: "🍳", n: "Steamed Egg", sub: "계란찜", v: 7, cat: "Sides", m: ["kbbq"] },
  { id: "japchae", e: "🍲", n: "Japchae", sub: "잡채", v: 13, cat: "Sides", m: ["kbbq"] },
  { id: "cornCheese", e: "🧀", n: "Corn Cheese", sub: "콘치즈", v: 9, cat: "Sides", m: ["kbbq"] },
  { id: "rice", e: "🍚", n: "Rice", sub: "공기밥", v: 3, cat: "Sides", m: ["kbbq"] },

  // --- DRINKS (shared) ---
  { id: "soju", e: "🍶", n: "Soju", sub: "소주", v: 12, cat: "Drinks", m: ["kbbq", "hotpot"] },
  { id: "beer", e: "🍺", n: "Beer", sub: "맥주 · 啤酒", v: 7, cat: "Drinks", m: ["kbbq", "hotpot"] },
  { id: "boba", e: "🧋", n: "Boba", sub: "珍珠奶茶", v: 6, cat: "Drinks", m: ["kbbq", "hotpot"] },
  { id: "soda", e: "🥤", n: "Soda", sub: "탄산음료", v: 3, cat: "Drinks", m: ["kbbq", "hotpot"] },
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
 */
export const VERDICTS = [
  {
    max: 0.55,
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
    max: 1.1,
    t: "Break Even",
    s: "Nobody won. Nobody lost. The most disappointing outcome available.",
    tone: "flat",
  },
  {
    max: 1.5,
    t: "In The Green",
    s: "You beat the house. Leave calmly. Do not make eye contact.",
    tone: "win",
  },
  {
    max: 2.2,
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
