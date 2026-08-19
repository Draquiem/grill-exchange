/**
 * CONFETTI
 *
 * Hand-rolled canvas burst — no dependency, same reasoning as receipt.js.
 * Two cannons fire inward from the bottom corners so it reads as "shot out"
 * rather than "fell from the ceiling".
 *
 * Returns a cancel function. Call it on unmount, or to cut a burst short
 * before firing a new one.
 *
 * Honours prefers-reduced-motion by doing nothing at all — the message that
 * accompanies this still renders, so the easter egg is not lost, just quiet.
 */

const COLORS = ["#ff5c2b", "#74d68e", "#e8b13d", "#f4ebdf", "#ffb08a"];

const NOOP = () => {};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

export function confettiBurst({ count = 160, fadeAfter = 1500 } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return NOOP;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return NOOP;
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:60;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  window.addEventListener("resize", size);

  // y grows downward, so upward launches are negative angles.
  const cannons = [
    { x: -8, y: H * 0.99, dir: -Math.PI / 3 },        // bottom-left, up and right
    { x: W + 8, y: H * 0.99, dir: (-Math.PI * 2) / 3 } // bottom-right, up and left
  ];

  const parts = [];
  for (let i = 0; i < count; i++) {
    const c = cannons[i % cannons.length];
    const angle = c.dir + rand(-0.42, 0.42);
    const speed = rand(15, 30);
    parts.push({
      x: c.x,
      y: c.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: rand(6, 11),
      h: rand(9, 16),
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.28, 0.28),
      flutter: rand(0, Math.PI * 2),
      flutterRate: rand(0.12, 0.26),
      color: pick(COLORS),
      alpha: 1,
    });
  }

  const GRAVITY = 0.36;
  const DRAG = 0.986;

  let raf = 0;
  let done = false;
  const start = performance.now();
  let last = start;

  const cleanup = () => {
    if (done) return;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("resize", size);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };

  const frame = (now) => {
    // Normalise to 60fps steps so a slow frame doesn't stall the physics,
    // and clamp so a backgrounded tab doesn't teleport everything offscreen.
    const dt = Math.min((now - last) / 16.667, 3);
    last = now;
    const elapsed = now - start;

    ctx.clearRect(0, 0, W, H);

    let alive = 0;
    for (const p of parts) {
      p.vy += GRAVITY * dt;
      p.vx *= Math.pow(DRAG, dt);
      p.vy *= Math.pow(DRAG, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      p.flutter += p.flutterRate * dt;

      if (elapsed > fadeAfter) p.alpha = Math.max(0, p.alpha - 0.012 * dt);
      if (p.alpha <= 0 || p.y - p.h > H) continue;

      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      // Squashing the height as it spins reads as a fluttering ribbon.
      const h = p.h * Math.abs(Math.cos(p.flutter));
      ctx.fillRect(-p.w / 2, -h / 2, p.w, h);
      ctx.restore();
    }

    if (alive > 0) raf = requestAnimationFrame(frame);
    else cleanup();
  };

  raf = requestAnimationFrame(frame);
  return cleanup;
}
