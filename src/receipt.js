/**
 * RECEIPT RENDERER
 *
 * Draws the settlement to a canvas and hands back a PNG blob. Canvas rather
 * than html-to-image on purpose: no new dependency, and the share image wants
 * a fixed portrait layout that looks nothing like the responsive app anyway.
 *
 * Layout is two-pass. Blocks declare their height, we sum to size the canvas,
 * then draw at a running cursor. Nothing measures against a live DOM node.
 *
 * The web fonts come from Google Fonts, so callers must await document.fonts
 * before drawing or the whole thing silently renders in Times.
 */

import { money } from "./party.js";

const W = 760;
const PAD = 46;
const SCALE = 2;

const C = {
  char: "#161210",
  slab: "#211b17",
  bone: "#f4ebdf",
  marble: "#a8968a",
  ash: "#3b302a",
  ember: "#ff5c2b",
  scallion: "#74d68e",
  amber: "#e8b13d",
};

const toneColor = (tone) =>
  tone === "win" ? C.scallion : tone === "loss" ? C.ember : C.amber;

const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";
const DISP = "'Archivo Black', system-ui, sans-serif";

const font = (weight, size, family = MONO) => `${weight} ${size}px ${family}`;

/** Wait for the webfonts, but never hang the button on a slow network. */
export async function fontsReady(timeoutMs = 2500) {
  if (!document.fonts) return;
  try {
    await Promise.race([
      document.fonts.load(font(700, 13)).then(() => document.fonts.load(font(400, 46, DISP))),
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]);
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, timeoutMs))]);
  } catch {
    /* fall through to system fonts */
  }
}

function wrap(ctx, str, maxW) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ---- primitive draw helpers ---------------------------------------- */

function text(ctx, str, x, y, { f = font(400, 13), color = C.bone, align = "left" } = {}) {
  ctx.font = f;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(str, x, y);
  ctx.textAlign = "left";
}

function rule(ctx, y, { dashed = false, color = C.ash, inset = 0 } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(dashed ? [3, 4] : []);
  ctx.beginPath();
  ctx.moveTo(PAD + inset, y + 0.5);
  ctx.lineTo(W - PAD - inset, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

/** label ......... value, the way a receipt does it */
function leader(ctx, left, right, y, opts = {}) {
  const lf = opts.leftFont || font(400, 13);
  const rf = opts.rightFont || font(500, 13);
  const lc = opts.leftColor || C.bone;
  const rc = opts.rightColor || C.marble;
  const indent = opts.indent || 0;

  text(ctx, left, PAD + indent, y, { f: lf, color: lc });
  text(ctx, right, W - PAD, y, { f: rf, color: rc, align: "right" });

  ctx.font = lf;
  const lw = ctx.measureText(left).width;
  ctx.font = rf;
  const rw = ctx.measureText(right).width;
  const gapL = PAD + indent + lw + 8;
  const gapR = W - PAD - rw - 8;
  if (gapR > gapL) {
    ctx.save();
    ctx.strokeStyle = C.ash;
    ctx.lineWidth = 1;
    ctx.setLineDash([1, 4]);
    ctx.beginPath();
    ctx.moveTo(gapL, y - 4.5);
    ctx.lineTo(gapR, y - 4.5);
    ctx.stroke();
    ctx.restore();
  }
}

/** torn-paper zigzag, drawn in the page colour to bite into the slab */
function zigzag(ctx, y, h, down) {
  const teeth = 38;
  const w = W / teeth;
  ctx.fillStyle = C.char;
  ctx.beginPath();
  if (down) {
    ctx.moveTo(0, y);
    for (let i = 0; i < teeth; i++) {
      ctx.lineTo(i * w + w / 2, y + h);
      ctx.lineTo((i + 1) * w, y);
    }
    ctx.lineTo(W, y + h + 4);
    ctx.lineTo(0, y + h + 4);
  } else {
    ctx.moveTo(0, y + h);
    for (let i = 0; i < teeth; i++) {
      ctx.lineTo(i * w + w / 2, y);
      ctx.lineTo((i + 1) * w, y + h);
    }
    ctx.lineTo(W, y - 4);
    ctx.lineTo(0, y - 4);
  }
  ctx.closePath();
  ctx.fill();
}

/* ---- the document ---------------------------------------------------- */

/**
 * @param {object} d  { lines, shared, table } from derive()
 * @param {object} meta { cover, minutes, mode, when }
 * @returns {HTMLCanvasElement}
 */
export function drawReceipt(d, meta) {
  // Measuring context — real canvas gets sized once we know the height.
  const mctx = document.createElement("canvas").getContext("2d");
  mctx.font = font(400, 13);

  const blocks = [];
  const push = (h, render) => blocks.push({ h, render });

  const innerW = W - PAD * 2;

  // ---- masthead
  push(96, (ctx, y) => {
    ctx.fillStyle = C.ember;
    ctx.beginPath();
    ctx.arc(PAD + 5, y + 34, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, "THE GRILL EXCHANGE", PAD + 20, y + 39, {
      f: font(700, 15),
      color: C.bone,
    });
    ctx.save();
    ctx.letterSpacing = "2px";
    text(ctx, meta.mode === "hotpot" ? "HOT POT" : "KBBQ", W - PAD, y + 39, {
      f: font(700, 11),
      color: C.marble,
      align: "right",
    });
    ctx.restore();
    text(ctx, "SETTLEMENT · " + meta.when, PAD, y + 66, {
      f: font(400, 11),
      color: C.marble,
    });
  });

  push(14, (ctx, y) => rule(ctx, y + 6));

  // ---- terms
  push(20, () => {});
  const terms = [
    ["Cover / person", money(meta.cover)],
    ["Party", String(d.lines.length)],
    ["Duration", meta.minutes + "m"],
    ["Plates", String(d.table.plates)],
  ];
  for (const [k, v] of terms) {
    push(26, (ctx, y) =>
      leader(ctx, k, v, y + 18, { leftFont: font(400, 13), leftColor: C.marble })
    );
  }
  push(20, (ctx, y) => rule(ctx, y + 10));

  // ---- per person
  for (const l of d.lines) {
    push(38, (ctx, y) => {
      text(ctx, l.name.toUpperCase(), PAD, y + 26, { f: font(700, 14), color: C.bone });
      text(ctx, l.ratio.toFixed(2) + "×", W - PAD, y + 26, {
        f: font(700, 14),
        color: toneColor(l.verdict.tone),
        align: "right",
      });
    });

    if (l.rows.length === 0 && l.sharedEach === 0) {
      push(26, (ctx, y) =>
        text(ctx, "  nothing logged", PAD, y + 17, { f: font(400, 12), color: C.ash })
      );
    }

    for (const r of l.rows) {
      push(24, (ctx, y) =>
        leader(
          ctx,
          `${r.item.n}  ×${r.c}`,
          money(r.value),
          y + 17,
          { indent: 14, leftFont: font(400, 12.5), leftColor: C.marble }
        )
      );
    }

    if (l.sharedEach > 0) {
      push(24, (ctx, y) =>
        leader(ctx, "share of the table", money(l.sharedEach), y + 17, {
          indent: 14,
          leftFont: font(400, 12.5),
          leftColor: C.ash,
          rightColor: C.ash,
        })
      );
    }

    push(30, (ctx, y) => {
      const up = l.pnl >= 0;
      text(ctx, l.verdict.t, PAD + 14, y + 20, {
        f: font(700, 12.5),
        color: toneColor(l.verdict.tone),
      });
      text(ctx, (up ? "+" : "−") + money(Math.abs(l.pnl)), W - PAD, y + 20, {
        f: font(700, 13),
        color: toneColor(l.verdict.tone),
        align: "right",
      });
    });

    push(18, (ctx, y) => rule(ctx, y + 9, { dashed: true }));
  }

  // ---- shared plates
  if (d.shared.rows.length) {
    push(36, (ctx, y) => {
      text(ctx, "SHARED", PAD, y + 24, { f: font(700, 13), color: C.bone });
      text(ctx, "split " + d.lines.length + " ways", W - PAD, y + 24, {
        f: font(400, 11),
        color: C.marble,
        align: "right",
      });
    });
    for (const r of d.shared.rows) {
      push(24, (ctx, y) =>
        leader(ctx, `${r.item.n}  ×${r.c}`, money(r.value), y + 17, {
          indent: 14,
          leftFont: font(400, 12.5),
          leftColor: C.marble,
        })
      );
    }
    push(20, (ctx, y) => rule(ctx, y + 10));
  }

  // ---- the book
  push(34, (ctx, y) =>
    text(ctx, "THE BOOK", PAD, y + 24, { f: font(700, 13), color: C.bone })
  );
  for (const [k, v] of [
    ["Eaten", money(d.table.eaten)],
    ["Paid", money(d.table.paid)],
  ]) {
    push(26, (ctx, y) =>
      leader(ctx, k, v, y + 18, { leftFont: font(400, 13), leftColor: C.marble })
    );
  }
  push(16, (ctx, y) => rule(ctx, y + 8));

  // ---- the number
  const tone = toneColor(d.table.verdict.tone);
  push(84, (ctx, y) => {
    const up = d.table.pnl >= 0;
    text(ctx, "POSITION", PAD, y + 20, { f: font(400, 10), color: C.marble });
    text(
      ctx,
      (up ? "+" : "−") + money(Math.abs(d.table.pnl)).slice(1),
      PAD,
      y + 66,
      { f: font(400, 46, DISP), color: tone }
    );
    text(ctx, d.table.ratio.toFixed(2) + "×", W - PAD, y + 66, {
      f: font(700, 20),
      color: tone,
      align: "right",
    });
  });

  push(34, (ctx, y) =>
    text(ctx, d.table.verdict.t, PAD, y + 24, { f: font(400, 21, DISP), color: C.bone })
  );

  mctx.font = font(400, 12.5);
  const quip = wrap(mctx, d.table.verdict.s, innerW);
  push(quip.length * 20 + 8, (ctx, y) => {
    quip.forEach((ln, i) =>
      text(ctx, ln, PAD, y + 14 + i * 20, { f: font(400, 12.5), color: C.marble })
    );
  });

  if (d.table.topLine && d.lines.length > 1 && d.table.topLine.eaten > 0) {
    push(30, (ctx, y) =>
      text(
        ctx,
        `Heaviest position: ${d.table.topLine.name} at ${money(d.table.topLine.eaten)}.`,
        PAD,
        y + 20,
        { f: font(400, 12), color: C.marble }
      )
    );
  }

  push(30, (ctx, y) => rule(ctx, y + 16));
  push(40, (ctx, y) => {
    text(ctx, "Valued at a-la-carte prices for AYCE-sized plates.", PAD, y + 16, {
      f: font(400, 10.5),
      color: "#6d5f56",
    });
    text(ctx, "Your restaurant will disagree.", PAD, y + 32, {
      f: font(400, 10.5),
      color: "#6d5f56",
    });
  });

  // ---- size and draw
  const TEAR = 12;
  const bodyH = blocks.reduce((s, b) => s + b.h, 0);
  const H = Math.ceil(bodyH + TEAR * 2 + 24);

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = C.slab;
  ctx.fillRect(0, 0, W, H);
  // faint warm bloom behind the masthead, echoing the board
  const g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
  g.addColorStop(0, "rgba(255,92,43,0.10)");
  g.addColorStop(1, "rgba(255,92,43,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 260);

  let y = TEAR + 12;
  for (const b of blocks) {
    b.render(ctx, y);
    y += b.h;
  }

  zigzag(ctx, 0, TEAR, false);
  zigzag(ctx, H - TEAR, TEAR, true);

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
