/**
 * ANALYST NOTES
 *
 * The desk's running read on your position. One line at a time, chosen from
 * whichever notes currently qualify, highest weight winning.
 *
 * Same split as easterEggs.js: the predicates live here and stay pure, the
 * component only wires firing to display. No Date.now(), no Math.random() —
 * elapsed and idle minutes arrive through the context so this file can be
 * exercised straight from node.
 *
 * ---------------------------------------------------------------------------
 * WRITING THE LINES
 * ---------------------------------------------------------------------------
 * Every note below ships with `line: ""`. An empty line is DISABLED — it will
 * never fire. Fill in the ones you want and leave the rest blank; the engine
 * skips them silently, so you can write these a few at a time.
 *
 * House voice applies (see CLAUDE.md): deadpan trading desk, dry, one
 * sentence, lands on an image rather than a punchline. No exclamation marks —
 * the 6mildil line is the single deliberate exception in this codebase and it
 * is not a licence for a second one.
 *
 * `hint` is a note to you about when the line fires. It is never displayed;
 * delete it or leave it, it costs nothing.
 * ---------------------------------------------------------------------------
 */

/** Categories that read as playing it safe. Used by the `defensive` note. */
const CHEAP_CATS = ["Chicken", "Vegetables", "Carbs"];
const DRINK_CAT = "Drinks";

/**
 * Build the fact sheet a predicate reasons over.
 *
 * `scope` is "diner" for one person's book or "table" for the pooled one.
 * Everything is precomputed so predicates stay one-liners and cheap to re-run
 * on every keystroke.
 */
export function noteContext({
  scope,
  bucket,
  value,
  paid,
  plates,
  items,
  people = 1,
  tableRatio = 0,
  tablePlates = 0,
  sharedPlates = 0,
  ratios = [],
  rank = 1,
  elapsedMins = 0,
  idleMins = 0,
  minsLeft = Infinity,
  mode = "kbbq",
}) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const entries = Object.entries(bucket || {}).filter(([id]) => byId[id]);

  const byCat = {};
  let top = null;
  for (const [id, c] of entries) {
    const it = byId[id];
    const v = c * it.v;
    const slot = byCat[it.cat] || (byCat[it.cat] = { plates: 0, value: 0 });
    slot.plates += c;
    slot.value += v;
    if (!top || v > top.value) top = { item: it, c, value: v };
  }

  const distinct = entries.length;
  const maxOne = entries.reduce((m, [, c]) => Math.max(m, c), 0);
  const catValue = (cat) => (byCat[cat] ? byCat[cat].value : 0);
  const catShare = (cat) => (value > 0 ? catValue(cat) / value : 0);

  // Value excluding drinks — drinks sit outside the AYCE cover, so a
  // "what did you actually eat" read has to net them out.
  const foodValue = value - catValue(DRINK_CAT);

  return {
    scope,
    value,
    foodValue,
    paid,
    plates,
    ratio: paid > 0 ? value / paid : 0,
    distinct,
    maxOne,
    top,
    concentration: value > 0 && top ? top.value / value : 0,
    avgPrice: plates > 0 ? value / plates : 0,
    byCat,
    catValue,
    catShare,
    cheapShare: CHEAP_CATS.reduce((s, c) => s + catShare(c), 0),
    drinkShare: catShare(DRINK_CAT),
    people,
    tableRatio,
    tablePlates,
    sharedPlates,
    sharedShare: tablePlates > 0 ? sharedPlates / tablePlates : 0,
    ratios,
    spread: ratios.length >= 2 ? Math.max(...ratios) - Math.min(...ratios) : 0,
    rank,
    elapsedMins,
    idleMins,
    minsLeft,
    mode,
  };
}

/**
 * The notes themselves.
 *
 * id      stable key — fires once per condition-entry, re-arms when it clears.
 *         Renaming an id re-arms that note; don't reuse one for a new meaning.
 * scope   "diner" reads one person's book, "table" reads the pooled one.
 * weight  when several qualify at once, highest wins. Ties break by array order.
 * when    predicate over the context above. Keep it pure.
 * line    ← YOU WRITE THIS. Empty string = disabled, never fires.
 */
export const NOTES = [
  /* ---------------------------- diner scope ---------------------------- */
  {
    id: "first-fill",
    scope: "diner",
    weight: 5,
    hint: "Their very first plate of the session.",
    when: (c) => c.plates === 1,
    line: "First plate of the session, woohoo! I am very proud that the first thing you order is not soju. - King",
  },
  {
    id: "defensive",
    scope: "diner",
    weight: 30,
    hint: "3+ plates and 80%+ of the value is chicken, veg or carbs.",
    when: (c) => c.plates >= 3 && c.cheapShare >= 0.8,
    line: "You're either very picky or bulking, either way, I like your style.",
  },
  {
    id: "index",
    scope: "diner",
    weight: 35,
    hint: "6+ different items, never more than one of any of them.",
    when: (c) => c.distinct >= 6 && c.maxOne === 1,
    line: "Now that's what I call a diversified portfolio. Warren Buffet would be proud.",
  },
  {
    id: "concentrated",
    scope: "diner",
    weight: 40,
    hint: "5+ of a single item, and it's half their book or more.",
    when: (c) => c.top && c.top.c >= 5 && c.concentration >= 0.5,
    line: "You really know what you like, don't you? That's a solid choice.",
  },
  {
    id: "carried",
    scope: "diner",
    weight: 55,
    hint: "Under 0.5x while the table as a whole is comfortably up.",
    when: (c) => c.people >= 2 && c.plates >= 1 && c.ratio < 0.5 && c.tableRatio > 1.2,
    line: "Someone is absolutely just putting you in their backpack right now. Order more!",
  },
  {
    id: "whale",
    scope: "diner",
    weight: 50,
    hint: "Top of the table by value, and past 2x on their own cover.",
    when: (c) => c.people >= 2 && c.rank === 1 && c.ratio >= 2,
    line: "You're the whale of the table (but not like in a fat shaming sort of way)! King would be so proud.",
  },
  {
    id: "spectating",
    scope: "diner",
    weight: 45,
    hint: "Has logged nothing while the table is 8+ plates deep.",
    when: (c) => c.plates === 0 && c.tablePlates >= 8,
    line: "You're watching from the sidelines, aren't you? Might as well start the play-by-play commentary.",
  },
  {
    id: "premium-only",
    scope: "diner",
    weight: 32,
    hint: "4+ plates averaging $6 or more — straight for the good cuts.",
    when: (c) => c.plates >= 4 && c.avgPrice >= 6,
    line: "I see you're focused on the premium cuts... I like your style.",
  },
  {
    id: "bargain-bin",
    scope: "diner",
    weight: 41,
    // Sits above `defensive` (30) and `concentrated` (40) on purpose: cheap
    // items live in the cheap categories, so those two fire alongside this one
    // almost every time. Stricter condition, higher weight — otherwise this
    // note is unreachable in every realistic order.
    hint: "5+ plates averaging under $2.",
    when: (c) => c.plates >= 5 && c.avgPrice <= 2,
    line: "STOP GOING FOR THE CHEAP STUFF. You are a disgrace to the AYCE community.",
  },
  {
    id: "crossed-over",
    scope: "diner",
    weight: 60,
    hint: "Just cleared break-even — fires in the window either side of 1.0x.",
    when: (c) => c.ratio >= 1 && c.ratio < 1.15,
    line: "You have officially breached the green zone. From this point onward, you are in the money.",
  },
  {
    id: "deep-green",
    scope: "diner",
    weight: 65,
    hint: "Past 2.4x, the top verdict tier.",
    when: (c) => c.ratio >= 2.4,
    line: "Holy balls, you are DEEP in the green. Maybe you should consider trading some of that profit for a round of soju.",
  },
  {
    id: "drinking-the-position",
    scope: "diner",
    weight: 38,
    hint: "3+ plates and 40%+ of their book is drinks, which aren't in the cover.",
    when: (c) => c.plates >= 3 && c.drinkShare >= 0.4,
    line: "I notice there is a lot of Soju in your book. Is Brandon part of the party by chance? Just... make sure not to pass him the car keys.",
  },

  /* ---------------------------- table scope ---------------------------- */
  {
    id: "volume-dry",
    scope: "table",
    weight: 42,
    hint: "12 minutes since anything was logged, with 4+ plates on the book.",
    when: (c) => c.plates >= 4 && c.idleMins >= 12,
    line: "The table has been quiet for a while. Did you forget to log something or just in a food coma?",
  },
  {
    id: "hot-open",
    scope: "table",
    weight: 44,
    hint: "8+ plates inside the first 10 minutes.",
    when: (c) => c.elapsedMins <= 10 && c.plates >= 8,
    line: "THE TABLE IS OFF TO A HOT START! WOW!",
  },
  {
    id: "lockstep",
    scope: "table",
    weight: 36,
    hint: "3+ diners all within 0.15x of each other, 6+ plates in.",
    when: (c) => c.people >= 3 && c.plates >= 6 && c.spread <= 0.15,
    line: "",
  },
  {
    id: "lopsided",
    scope: "table",
    weight: 46,
    hint: "The table's spread has opened past 1.0x between best and worst.",
    when: (c) => c.people >= 2 && c.plates >= 6 && c.spread >= 1,
    line: "",
  },
  {
    id: "communal",
    scope: "table",
    weight: 34,
    hint: "Half or more of everything ordered went to the shared bucket.",
    when: (c) => c.plates >= 6 && c.sharedShare >= 0.5,
    line: "",
  },
  {
    id: "last-call",
    scope: "table",
    weight: 58,
    hint: "10 minutes or less on the clock and the table is still underwater.",
    when: (c) => c.minsLeft <= 10 && c.minsLeft > 0 && c.plates >= 1 && c.ratio < 1,
    line: "We are lowkey in shambles unless someone orders more food.",
  },
];

/** A note only counts as written once it has a non-empty line. */
export const isWritten = (n) => typeof n.line === "string" && n.line.trim() !== "";

/**
 * Every written note whose predicate currently holds, best first.
 * Pure: same context in, same list out.
 */
export function evaluateNotes(ctx, notes = NOTES) {
  return notes
    .filter((n) => n.scope === ctx.scope && isWritten(n))
    .filter((n) => {
      try {
        return n.when(ctx);
      } catch {
        // A malformed predicate must never take the board down with it.
        return false;
      }
    })
    .sort((a, b) => b.weight - a.weight);
}

/** The single note the desk is currently showing, or null. */
export function topNote(ctx, notes = NOTES) {
  return evaluateNotes(ctx, notes)[0] || null;
}
