/**
 * EASTER EGGS
 *
 * Trigger predicates live here, apart from the effects that celebrate them,
 * so the "what fires" half stays pure and testable and the component only has
 * to wire the two together.
 */

/**
 * Deliberate voice exception: the message below breaks the no-exclamation-mark
 * rule in CLAUDE.md. That is the joke — the deadpan trading desk drops its
 * composure for exactly one person. Do not "fix" the punctuation.
 */
export const FAMOUS = {
  match: "6mildil",
  message: "wow you have famous rapper 6mildil in your party, how cool!",
};

/** Names are user-typed, so match forgivingly on case and stray whitespace. */
export const normalizeName = (name) =>
  String(name == null ? "" : name).trim().toLowerCase();

export const isFamous = (name) => normalizeName(name) === FAMOUS.match;

/** Ids of everyone in the party who currently qualifies. */
export const famousIds = (people) =>
  (people || []).filter((p) => isFamous(p.name)).map((p) => p.id);

/* -------------------------------------------------------------------- */

/**
 * SOJU WATCH
 *
 * Counts soju across the whole table — every diner plus the shared bucket —
 * and drops a dry aside once the table is deep enough in it.
 *
 * Unlike the 6mildil line, these stay in house voice. A deadpan safety
 * question is funnier than an enthusiastic one, and the joke should never
 * read as cheering the table on.
 */
export const SOJU_ID = "soju";

export const SOJU_TIERS = [
  { at: 5, line: "That is five soju on the book. You have a designated driver, right?" },
  { at: 8, line: "Eight soju. The grill has gone unattended for some time now." },
  { at: 12, line: "Twelve soju. This position gets reviewed tomorrow, painfully." },
];

/** Total of one item across every owner, shared bucket included. */
export const countItem = (counts, itemId) =>
  Object.values(counts || {}).reduce(
    (sum, bucket) => sum + ((bucket && bucket[itemId]) || 0),
    0
  );

/** Highest tier the count has reached, or null below the first threshold. */
export const sojuTier = (n) => {
  let hit = null;
  for (const t of SOJU_TIERS) if (n >= t.at) hit = t;
  return hit;
};
