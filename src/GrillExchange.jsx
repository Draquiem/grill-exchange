import { useState, useMemo, useRef, useEffect } from "react";
import { ITEMS, CAT_ORDER, VERDICTS } from "./menu.js";
import "./GrillExchange.css";

const money = (n) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GrillExchange() {
  const [mode, setMode] = useState("kbbq");
  const [counts, setCounts] = useState({});
  const [cover, setCover] = useState("34.99");
  const [diners, setDiners] = useState(1);
  const [minutes, setMinutes] = useState(90);
  const [flash, setFlash] = useState(0);

  const firstRun = useRef(true);

  const paid = (parseFloat(cover) || 0) * diners;

  const eaten = useMemo(
    () => ITEMS.reduce((sum, it) => sum + (counts[it.id] || 0) * it.v, 0),
    [counts]
  );

  const plates = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const ratio = paid > 0 ? eaten / paid : 0;
  const pnl = eaten - paid;
  const verdict = VERDICTS.find((v) => ratio < v.max) || VERDICTS[VERDICTS.length - 1];
  const started = plates > 0;

  // Highest-contributing item, by total value not by count.
  const mvp = useMemo(() => {
    let best = null;
    for (const it of ITEMS) {
      const c = counts[it.id] || 0;
      if (!c) continue;
      const contrib = c * it.v;
      if (!best || contrib > best.contrib) best = { ...it, c, contrib };
    }
    return best;
  }, [counts]);

  const logged = useMemo(
    () =>
      ITEMS.filter((it) => counts[it.id]).sort(
        (a, b) => counts[b.id] * b.v - counts[a.id] * a.v
      ),
    [counts]
  );

  // Re-key the P&L number on change so the tick animation replays.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setFlash((f) => f + 1);
  }, [eaten]);

  const bump = (id, delta) =>
    setCounts((c) => {
      const next = Math.max(0, (c[id] || 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const tone = !started ? "idle" : verdict.tone;
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
          <span className="gx-label">Position</span>
          <span className="gx-label">{started ? ratio.toFixed(2) + "× cover" : "—"}</span>
        </div>

        <div className="gx-pnl" key={flash}>
          {started ? (pnl >= 0 ? "+" : "−") + money(Math.abs(pnl)).slice(1) : "$0.00"}
        </div>

        <div
          className="gx-bar"
          role="img"
          aria-label={`${Math.round(ratio * 100)} percent of cover recovered`}
        >
          <div className="gx-bar-fill" style={{ width: Math.min(ratio, 1) * 100 + "%" }} />
          {ratio > 1 && (
            <div
              className="gx-bar-over"
              style={{ width: Math.min((ratio - 1) / 1.5, 1) * 100 + "%" }}
            />
          )}
          <div className="gx-bar-mark" />
        </div>

        <div className="gx-verdict">{started ? verdict.t : "No Position Yet"}</div>
        <p className="gx-quip">
          {started ? verdict.s : "Tap what hits the grill. The board updates as you eat."}
        </p>

        <div className="gx-stats">
          <Stat k="Eaten" v={money(eaten)} />
          <Stat k="Paid" v={money(paid)} />
          <Stat k="Plates" v={String(plates)} />
          <Stat k="Pace" v={minutes > 0 ? money(eaten / minutes) + "/min" : "—"} />
        </div>

        {started && ratio < 1 && (
          <div className="gx-todo">
            {money(paid - eaten)} to break even
            {mvp
              ? ` · about ${Math.ceil((paid - eaten) / mvp.v)} more ${mvp.n.toLowerCase()}`
              : ""}
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
          label="Diners"
          value={diners}
          fmt={(v) => String(v)}
          onChange={(d) => setDiners((v) => Math.max(1, Math.min(20, v + d)))}
        />

        <Stepper
          label="Minutes"
          value={minutes}
          fmt={(v) => v + "m"}
          onChange={(d) => setMinutes((v) => Math.max(15, Math.min(240, v + d * 15)))}
        />
      </section>

      {/* ---- the floor ---- */}
      <section className="gx-floor">
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
                  const c = counts[it.id] || 0;
                  return (
                    <div key={it.id} className={"gx-card" + (c ? " held" : "")}>
                      <button
                        className="gx-card-hit"
                        onClick={() => bump(it.id, 1)}
                        aria-label={`Add ${it.n}, ${money(it.v)} value`}
                      >
                        <span className="gx-e" aria-hidden="true">
                          {it.e}
                        </span>
                        <span className="gx-n">{it.n}</span>
                        <span className="gx-sub">{it.sub}</span>
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

      {/* ---- receipt ---- */}
      {started && (
        <section className="gx-receipt">
          <div className="gx-cat-head">
            <span className="gx-cat-name">Filled</span>
            <span className="gx-rule" />
          </div>
          {logged.map((it) => (
            <div key={it.id} className="gx-row">
              <span className="gx-row-n">
                {it.e} {it.n} <em>×{counts[it.id]}</em>
              </span>
              <span className="gx-dots" />
              <span className="gx-row-v">{money(counts[it.id] * it.v)}</span>
            </div>
          ))}
          {mvp && (
            <div className="gx-mvp">
              Carried by{" "}
              <strong>
                {mvp.e} {mvp.n}
              </strong>{" "}
              — {money(mvp.contrib)} of your total
            </div>
          )}
          <button className="gx-reset" onClick={() => setCounts({})}>
            Clear the table
          </button>
        </section>
      )}

      <footer className="gx-foot">
        Values are typical à-la-carte prices for one AYCE-sized plate. Your mileage, and
        your restaurant, will vary.
      </footer>
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
