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
