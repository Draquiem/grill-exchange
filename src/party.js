/**
 * PARTY STATE + PER-PERSON MATH
 *
 * Kept out of the component and free of React so the money math can be tested
 * on its own. Everything here is pure — the reducer runs twice under
 * StrictMode, so no Date.now(), no Math.random(), no mutation.
 *
 * Shape:
 *   people   [{ id, name }]           the party, in seating order
 *   activeId which person taps land on — or TABLE
 *   counts   { [ownerId]: { [itemId]: n } }
 *   seq      monotonic id source, so ids stay stable and pure
 *
 * TABLE is a reserved owner id for plates nobody can claim individually — the
 * brisket everyone picked at. Its value splits evenly across the party, which
 * is the honest way to book a shared plate. Without it people end up assigning
 * shared food to whoever happened to tap, and the per-person P&L is fiction.
 */

export const TABLE = "__table";

/** Shared money formatter — the component and the receipt must agree. */
export const money = (n) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function initParty() {
  return {
    people: [{ id: "p1", name: "You" }],
    activeId: "p1",
    counts: {},
    seq: 2,
  };
}

export function partyReducer(state, action) {
  switch (action.type) {
    case "add_person": {
      if (state.people.length >= 12) return state;
      const id = "p" + state.seq;
      return {
        ...state,
        people: [...state.people, { id, name: action.name || `Diner ${state.people.length + 1}` }],
        activeId: id,
        seq: state.seq + 1,
      };
    }

    case "remove_person": {
      // Never let the party hit zero — paid would divide by nothing.
      if (state.people.length <= 1) return state;
      const people = state.people.filter((p) => p.id !== action.id);
      const counts = { ...state.counts };
      delete counts[action.id];
      const activeId =
        state.activeId === action.id ? people[people.length - 1].id : state.activeId;
      return { ...state, people, counts, activeId };
    }

    case "rename_person":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id ? { ...p, name: action.name } : p
        ),
      };

    case "set_active":
      return { ...state, activeId: action.id };

    case "bump": {
      const owner = action.owner;
      const prev = state.counts[owner] || {};
      const next = Math.max(0, (prev[action.itemId] || 0) + action.delta);
      const bucket = { ...prev };
      if (next === 0) delete bucket[action.itemId];
      else bucket[action.itemId] = next;

      const counts = { ...state.counts };
      if (Object.keys(bucket).length === 0) delete counts[owner];
      else counts[owner] = bucket;
      return { ...state, counts };
    }

    case "clear":
      return { ...state, counts: {} };

    default:
      return state;
  }
}

const sumBucket = (bucket, byId) =>
  Object.entries(bucket || {}).reduce(
    (s, [id, n]) => s + n * (byId[id] ? byId[id].v : 0),
    0
  );

const countBucket = (bucket) =>
  Object.values(bucket || {}).reduce((a, b) => a + b, 0);

/**
 * Turn party state into everything the UI and the receipt need.
 * `verdictFor` is injected so this file never imports the menu.
 */
export function derive({ people, counts }, items, coverEach, verdictFor) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const n = people.length || 1;

  const sharedBucket = counts[TABLE] || {};
  const sharedValue = sumBucket(sharedBucket, byId);
  const sharedPlates = countBucket(sharedBucket);
  const sharedEach = sharedValue / n;

  const lines = people.map((p) => {
    const own = counts[p.id] || {};
    const ownValue = sumBucket(own, byId);
    const eaten = ownValue + sharedEach;
    const ratio = coverEach > 0 ? eaten / coverEach : 0;
    return {
      ...p,
      own,
      ownValue,
      ownPlates: countBucket(own),
      sharedEach,
      eaten,
      paid: coverEach,
      pnl: eaten - coverEach,
      ratio,
      verdict: verdictFor(ratio),
      started: countBucket(own) > 0 || sharedPlates > 0,
      // Sorted item rows for the receipt, biggest contribution first.
      rows: Object.entries(own)
        .map(([id, c]) => ({ item: byId[id], c, value: c * (byId[id] ? byId[id].v : 0) }))
        .filter((r) => r.item)
        .sort((a, b) => b.value - a.value),
    };
  });

  const eaten = lines.reduce((s, l) => s + l.ownValue, 0) + sharedValue;
  const paid = coverEach * n;
  const plates = lines.reduce((s, l) => s + l.ownPlates, 0) + sharedPlates;
  const ratio = paid > 0 ? eaten / paid : 0;

  const sharedRows = Object.entries(sharedBucket)
    .map(([id, c]) => ({ item: byId[id], c, value: c * (byId[id] ? byId[id].v : 0) }))
    .filter((r) => r.item)
    .sort((a, b) => b.value - a.value);

  // Who ate the most value — the table's problem child.
  const topLine = lines.reduce(
    (best, l) => (!best || l.eaten > best.eaten ? l : best),
    null
  );

  return {
    lines,
    shared: { rows: sharedRows, value: sharedValue, plates: sharedPlates, each: sharedEach },
    table: {
      eaten,
      paid,
      plates,
      ratio,
      pnl: eaten - paid,
      verdict: verdictFor(ratio),
      started: plates > 0,
      topLine,
    },
  };
}

/** Total plates logged against one owner id — used for the card badges. */
export function ownerCount(counts, owner, itemId) {
  const b = counts[owner];
  return (b && b[itemId]) || 0;
}
