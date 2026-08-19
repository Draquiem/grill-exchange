import { useState, useMemo, useRef, useEffect, useReducer, useCallback } from "react";
import { ITEMS, CAT_ORDER, VERDICTS } from "./menu.js";
import {
  TABLE,
  money,
  initParty,
  partyReducer,
  derive,
  ownerCount,
} from "./party.js";
import { drawReceipt, canvasToBlob, fontsReady } from "./receipt.js";
import { FAMOUS, isFamous, famousIds } from "./easterEggs.js";
import { confettiBurst } from "./confetti.js";
import "./GrillExchange.css";

const verdictFor = (ratio) =>
  VERDICTS.find((v) => ratio < v.max) || VERDICTS[VERDICTS.length - 1];

const stamp = () =>
  new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function GrillExchange() {
  const [mode, setMode] = useState("kbbq");
  const [cover, setCover] = useState("34.99");
  const [minutes, setMinutes] = useState(90);
  const [party, dispatch] = useReducer(partyReducer, undefined, initParty);
  const [flash, setFlash] = useState(0);
  const [sheet, setSheet] = useState(null); // { url, blob } once a receipt is drawn
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [famousHit, setFamousHit] = useState(0);

  const firstRun = useRef(true);
  const celebrated = useRef(new Set());
  const cancelConfetti = useRef(null);
  const coverEach = parseFloat(cover) || 0;

  const d = useMemo(
    () => derive(party, ITEMS, coverEach, verdictFor),
    [party, coverEach]
  );

  const isTable = party.activeId === TABLE;
  const activeLine = d.lines.find((l) => l.id === party.activeId) || d.lines[0];

  // The board shows whichever book is selected: one diner's, or the table's.
  const view = isTable
    ? {
        name: "The Table",
        eaten: d.table.eaten,
        paid: d.table.paid,
        plates: d.table.plates,
        ratio: d.table.ratio,
        pnl: d.table.pnl,
        verdict: d.table.verdict,
        started: d.table.started,
      }
    : {
        name: activeLine.name,
        eaten: activeLine.eaten,
        paid: activeLine.paid,
        plates: activeLine.ownPlates,
        ratio: activeLine.ratio,
        pnl: activeLine.pnl,
        verdict: activeLine.verdict,
        started: activeLine.started,
      };

  // Biggest single contributor in the current view, by value not by count.
  const mvp = useMemo(() => {
    const bucket = isTable ? party.counts[TABLE] || {} : activeLine.own;
    let best = null;
    for (const it of ITEMS) {
      const c = bucket[it.id] || 0;
      if (!c) continue;
      const contrib = c * it.v;
      if (!best || contrib > best.contrib) best = { ...it, c, contrib };
    }
    return best;
  }, [isTable, party.counts, activeLine]);

  // Re-key the P&L number on change so the tick animation replays.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setFlash((f) => f + 1);
  }, [d.table.eaten]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 2600);
    return () => clearTimeout(t);
  }, [note]);

  // Easter egg: fire once when someone in the party *becomes* famous. Renaming
  // away drops them from the set, so renaming back celebrates again.
  useEffect(() => {
    const ids = new Set(famousIds(party.people));
    let fresh = false;
    for (const id of ids) if (!celebrated.current.has(id)) fresh = true;
    celebrated.current = ids;
    if (!fresh) return;
    if (cancelConfetti.current) cancelConfetti.current();
    cancelConfetti.current = confettiBurst();
    setFamousHit((n) => n + 1);
  }, [party.people]);

  useEffect(() => {
    if (!famousHit) return;
    const t = setTimeout(() => setFamousHit(0), 4200);
    return () => clearTimeout(t);
  }, [famousHit]);

  useEffect(
    () => () => {
      if (cancelConfetti.current) cancelConfetti.current();
    },
    []
  );

  // Object URLs are revoked when the sheet closes or is replaced.
  useEffect(() => () => sheet && URL.revokeObjectURL(sheet.url), [sheet]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const bump = (itemId, delta) =>
    dispatch({ type: "bump", owner: party.activeId, itemId, delta });

  const openReceipt = useCallback(async () => {
    setBusy(true);
    try {
      await fontsReady();
      const canvas = drawReceipt(d, {
        cover: coverEach,
        minutes,
        mode,
        when: stamp(),
      });
      const blob = await canvasToBlob(canvas);
      setSheet({ url: URL.createObjectURL(blob), blob });
    } finally {
      setBusy(false);
    }
  }, [d, coverEach, minutes, mode]);

  const shareReceipt = async () => {
    if (!sheet) return;
    const file = new File([sheet.blob], "grill-exchange-receipt.png", {
      type: "image/png",
    });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "The Grill Exchange" });
        return;
      }
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": sheet.blob }),
        ]);
        setNote("Copied to clipboard");
        return;
      }
      downloadReceipt();
    } catch (err) {
      // AbortError just means the user dismissed the OS share sheet.
      if (err && err.name !== "AbortError") downloadReceipt();
    }
  };

  const downloadReceipt = () => {
    if (!sheet) return;
    const a = document.createElement("a");
    a.href = sheet.url;
    a.download = "grill-exchange-receipt.png";
    a.click();
    setNote("Saved");
  };

  const tone = !view.started ? "idle" : view.verdict.tone;
  const visible = ITEMS.filter((it) => it.m.includes(mode));
  const cats = CAT_ORDER[mode].filter((c) => visible.some((it) => it.cat === c));

  return (
    <div className="gx-root">
      {/* ---- masthead ---- */}
      <header className="gx-mast">
        <div className="gx-mast-l">
          <span className="gx-dot" />
          <span className="gx-mark">THE GRILL EXCHANGE</span>
        </div>
        <div className="gx-seg" role="tablist" aria-label="Menu type">
          <button
            role="tab"
            aria-selected={mode === "kbbq"}
            className={"gx-seg-b" + (mode === "kbbq" ? " on" : "")}
            onClick={() => setMode("kbbq")}
          >
            KBBQ
          </button>
          <button
            role="tab"
            aria-selected={mode === "hotpot"}
            className={"gx-seg-b" + (mode === "hotpot" ? " on" : "")}
            onClick={() => setMode("hotpot")}
          >
            HOT POT
          </button>
        </div>
      </header>

      {/* ---- signature: the position board ---- */}
      <section className={"gx-board t-" + tone} aria-live="polite">
        <div className="gx-board-head">
          <span className="gx-label">{isTable ? "The Book" : view.name}</span>
          <span className="gx-label">
            {view.started ? view.ratio.toFixed(2) + "× cover" : "—"}
          </span>
        </div>

        <div className="gx-pnl" key={flash}>
          {view.started
            ? (view.pnl >= 0 ? "+" : "−") + money(Math.abs(view.pnl)).slice(1)
            : "$0.00"}
        </div>

        <div
          className="gx-bar"
          role="img"
          aria-label={`${Math.round(view.ratio * 100)} percent of cover recovered`}
        >
          <div
            className="gx-bar-fill"
            style={{ width: Math.min(view.ratio, 1) * 100 + "%" }}
          />
          {view.ratio > 1 && (
            <div
              className="gx-bar-over"
              style={{ width: Math.min((view.ratio - 1) / 1.5, 1) * 100 + "%" }}
            />
          )}
          <div className="gx-bar-mark" />
        </div>

        <div className="gx-verdict">
          {view.started ? view.verdict.t : "No Position Yet"}
        </div>
        <p className="gx-quip">
          {view.started
            ? view.verdict.s
            : isTable
            ? "Shared plates land here and split evenly across the party."
            : "Tap what hits the grill. The board updates as you eat."}
        </p>

        <div className="gx-stats">
          <Stat k="Eaten" v={money(view.eaten)} />
          <Stat k="Paid" v={money(view.paid)} />
          <Stat k="Plates" v={String(view.plates)} />
          <Stat k="Pace" v={minutes > 0 ? money(view.eaten / minutes) + "/min" : "—"} />
        </div>

        {view.started && view.ratio < 1 && (
          <div className="gx-todo">
            {money(view.paid - view.eaten)} to break even
            {mvp
              ? ` · about ${Math.ceil((view.paid - view.eaten) / mvp.v)} more ${mvp.n.toLowerCase()}`
              : ""}
          </div>
        )}
      </section>

      {/* ---- the party ---- */}
      <section className="gx-party">
        <div className="gx-cat-head">
          <span className="gx-cat-name">Party</span>
          <span className="gx-rule" />
          <button
            className="gx-add"
            onClick={() => dispatch({ type: "add_person" })}
            disabled={party.people.length >= 12}
          >
            + Diner
          </button>
        </div>

        <div className="gx-chips" role="tablist" aria-label="Whose plate">
          {d.lines.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={party.activeId === l.id}
              className={
                "gx-chip" +
                (party.activeId === l.id ? " on" : "") +
                (l.started ? " t-" + l.verdict.tone : "") +
                (isFamous(l.name) ? " famous" : "")
              }
              onClick={() => dispatch({ type: "set_active", id: l.id })}
            >
              <span className="gx-chip-n">
                {isFamous(l.name) && <span aria-hidden="true">🎤 </span>}
                {l.name}
              </span>
              <span className="gx-chip-v">
                {l.started ? l.ratio.toFixed(2) + "×" : "—"}
              </span>
            </button>
          ))}

          <button
            role="tab"
            aria-selected={isTable}
            className={"gx-chip gx-chip-table" + (isTable ? " on" : "")}
            onClick={() => dispatch({ type: "set_active", id: TABLE })}
          >
            <span className="gx-chip-n">Table</span>
            <span className="gx-chip-v">
              {d.shared.plates ? money(d.shared.value) : "shared"}
            </span>
          </button>
        </div>

        {isTable ? (
          <p className="gx-hint">
            Plates logged here belong to nobody in particular. Their value splits
            evenly across all {d.lines.length}.
          </p>
        ) : (
          <div className="gx-edit">
            <input
              className="gx-name-in"
              value={activeLine.name}
              maxLength={18}
              onChange={(e) =>
                dispatch({
                  type: "rename_person",
                  id: activeLine.id,
                  name: e.target.value,
                })
              }
              aria-label="Diner name"
            />
            <button
              className="gx-drop"
              onClick={() => dispatch({ type: "remove_person", id: activeLine.id })}
              disabled={party.people.length <= 1}
            >
              Remove
            </button>
          </div>
        )}
      </section>

      {/* ---- the deal terms ---- */}
      <section className="gx-terms">
        <label className="gx-term">
          <span className="gx-label">Cover / person</span>
          <div className="gx-money-in">
            <span>$</span>
            <input
              inputMode="decimal"
              value={cover}
              onChange={(e) => setCover(e.target.value.replace(/[^0-9.]/g, ""))}
              aria-label="Price per person"
            />
          </div>
        </label>

        <Stepper
          label="Minutes"
          value={minutes}
          fmt={(v) => v + "m"}
          onChange={(delta) =>
            setMinutes((v) => Math.max(15, Math.min(240, v + delta * 15)))
          }
        />
      </section>

      {/* ---- the floor ---- */}
      <section className="gx-floor">
        <p className="gx-logging">
          Logging to <strong>{isTable ? "the table" : activeLine.name}</strong>
        </p>
        {cats.map((cat) => (
          <div key={cat} className="gx-cat">
            <div className="gx-cat-head">
              <span className="gx-cat-name">{cat}</span>
              <span className="gx-rule" />
            </div>
            <div className="gx-grid">
              {visible
                .filter((it) => it.cat === cat)
                .map((it) => {
                  const c = ownerCount(party.counts, party.activeId, it.id);
                  return (
                    <div key={it.id} className={"gx-card" + (c ? " held" : "")}>
                      <button
                        className="gx-card-hit"
                        onClick={() => bump(it.id, 1)}
                        aria-label={`Add ${it.n}, ${money(it.v)} value, to ${
                          isTable ? "the table" : activeLine.name
                        }`}
                      >
                        <span className="gx-e" aria-hidden="true">
                          {it.e}
                        </span>
                        <span className="gx-n">{it.n}</span>
                        <span className="gx-v">{money(it.v)}</span>
                      </button>
                      {c > 0 && (
                        <>
                          <span className="gx-qty">×{c}</span>
                          <button
                            className="gx-minus"
                            onClick={() => bump(it.id, -1)}
                            aria-label={`Remove one ${it.n}`}
                          >
                            −
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      {/* ---- settlement ---- */}
      {d.table.started && (
        <section className="gx-receipt">
          <div className="gx-cat-head">
            <span className="gx-cat-name">Settlement</span>
            <span className="gx-rule" />
          </div>

          {d.lines.map((l) => (
            <div key={l.id} className="gx-book">
              <div className="gx-book-head">
                <span className="gx-book-n">{l.name}</span>
                <span className={"gx-book-r" + (l.started ? " t-" + l.verdict.tone : "")}>
                  {l.started ? l.ratio.toFixed(2) + "×" : "—"}
                </span>
              </div>
              {l.rows.map((r) => (
                <div key={r.item.id} className="gx-row">
                  <span className="gx-row-n">
                    {r.item.e} {r.item.n} <em>×{r.c}</em>
                  </span>
                  <span className="gx-dots" />
                  <span className="gx-row-v">{money(r.value)}</span>
                </div>
              ))}
              {l.sharedEach > 0 && (
                <div className="gx-row gx-row-dim">
                  <span className="gx-row-n">share of the table</span>
                  <span className="gx-dots" />
                  <span className="gx-row-v">{money(l.sharedEach)}</span>
                </div>
              )}
              {!l.started && <div className="gx-row gx-row-dim">nothing logged</div>}
              <div className="gx-book-foot">
                <span className={l.started ? "t-" + l.verdict.tone : ""}>
                  {l.started ? l.verdict.t : "No position"}
                </span>
                <span>{(l.pnl >= 0 ? "+" : "−") + money(Math.abs(l.pnl))}</span>
              </div>
            </div>
          ))}

          {d.shared.rows.length > 0 && (
            <div className="gx-book">
              <div className="gx-book-head">
                <span className="gx-book-n">Shared</span>
                <span className="gx-book-r">split {d.lines.length} ways</span>
              </div>
              {d.shared.rows.map((r) => (
                <div key={r.item.id} className="gx-row">
                  <span className="gx-row-n">
                    {r.item.e} {r.item.n} <em>×{r.c}</em>
                  </span>
                  <span className="gx-dots" />
                  <span className="gx-row-v">{money(r.value)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="gx-total">
            <span>The book</span>
            <span>
              {money(d.table.eaten)} on {money(d.table.paid)}
            </span>
          </div>

          {d.table.topLine && d.lines.length > 1 && d.table.topLine.eaten > 0 && (
            <div className="gx-mvp">
              Heaviest position: <strong>{d.table.topLine.name}</strong> at{" "}
              {money(d.table.topLine.eaten)}
            </div>
          )}

          <div className="gx-acts">
            <button className="gx-share" onClick={openReceipt} disabled={busy}>
              {busy ? "Drawing…" : "Settle up — receipt"}
            </button>
            <button className="gx-reset" onClick={() => dispatch({ type: "clear" })}>
              Clear the table
            </button>
          </div>
        </section>
      )}

      <footer className="gx-foot">
        Values are typical à-la-carte prices for one AYCE-sized plate. Your mileage, and
        your restaurant, will vary.
      </footer>

      {sheet && (
        <div
          className="gx-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Receipt"
          onClick={() => setSheet(null)}
        >
          <div className="gx-sheet-in" onClick={(e) => e.stopPropagation()}>
            <img className="gx-sheet-img" src={sheet.url} alt="Receipt for this meal" />
            <div className="gx-sheet-acts">
              <button className="gx-share" onClick={shareReceipt}>
                Share
              </button>
              <button className="gx-reset" onClick={downloadReceipt}>
                Save PNG
              </button>
              <button className="gx-reset" onClick={() => setSheet(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {famousHit > 0 && (
        <div className="gx-famous" key={famousHit} role="status" aria-live="polite">
          <div className="gx-famous-card">
            <span className="gx-famous-mic" aria-hidden="true">
              🎤
            </span>
            <p className="gx-famous-msg">{FAMOUS.message}</p>
          </div>
        </div>
      )}

      {note && (
        <div className="gx-note" role="status">
          {note}
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div className="gx-stat">
      <span className="gx-label">{k}</span>
      <span className="gx-stat-v">{v}</span>
    </div>
  );
}

function Stepper({ label, value, onChange, fmt }) {
  return (
    <div className="gx-term">
      <span className="gx-label">{label}</span>
      <div className="gx-step">
        <button onClick={() => onChange(-1)} aria-label={`Decrease ${label}`}>
          −
        </button>
        <span>{fmt(value)}</span>
        <button onClick={() => onChange(1)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}
