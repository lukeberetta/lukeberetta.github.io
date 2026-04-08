(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  // ── DOM setup ─────────────────────────────────────────────
  const blob = document.createElement("div");
  blob.className = "cursor-blob";
  document.body.appendChild(blob);
  document.body.classList.add("cursor-active");

  blob.style.marginLeft = "-10px";
  blob.style.marginTop  = "-10px";

  // ── State ─────────────────────────────────────────────────
  let mx = -100, my = -100;
  let bx = -100, by = -100;
  let vx = 0,    vy = 0;

  let isVisible  = false;
  let isHovering = false;
  let isPressed  = false;
  let rafId      = null;

  let hoverLerp = 0;

  // ── Magnetic elements ─────────────────────────────────────
  const MAG_RADIUS   = 60;
  const MAG_STRENGTH = 0.38;
  const MAG_LERP     = 0.10;

  const magTargets = [...document.querySelectorAll(".back-link, .project-icon, .project-folder-icon")]
    .map(el => ({ el, x: 0, y: 0, scale: 1 }));

  // ── Physics constants ─────────────────────────────────────
  // Heavy: low spring = lots of lag, low damping = carries momentum
  const SPRING           = 0.10;
  const DAMPING          = 0.72;
  const MAX_SPEED        = 18;
  const MAX_STRETCH      = 1.45;
  const HOVER_SCALE      = 2.6;
  const HOVER_LERP_SPEED = 0.09;

  // ── Mouse tracking ────────────────────────────────────────
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!isVisible) {
      bx = mx; by = my;
      isVisible = true;
      blob.classList.add("is-visible");
    }
  });

  document.addEventListener("mouseleave", () => {
    blob.classList.remove("is-visible");
    isVisible = false;
  });

  document.addEventListener("mouseenter", () => {
    if (mx !== -100) {
      blob.classList.add("is-visible");
      isVisible = true;
    }
  });

  // ── Hover detection ───────────────────────────────────────
  const INTERACTIVE = "a, button, [role='button'], label, input, select, textarea";

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(INTERACTIVE)) {
      isHovering = true;
      blob.classList.add("is-hovering");
    }
    if (e.target.closest(".back-link")) {
      blob.classList.add("is-merged");
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(INTERACTIVE)) {
      isHovering = false;
      blob.classList.remove("is-hovering");
    }
    if (e.target.closest(".back-link")) {
      blob.classList.remove("is-merged");
    }
  });

  // ── Click feedback ────────────────────────────────────────
  document.addEventListener("mousedown", () => { isPressed = true;  });
  document.addEventListener("mouseup",   () => { isPressed = false; });

  // ── rAF loop ──────────────────────────────────────────────
  const tick = () => {
    rafId = requestAnimationFrame(tick);
    if (!isVisible) return;

    // Spring physics
    vx += (mx - bx) * SPRING;
    vy += (my - by) * SPRING;
    vx *= DAMPING;
    vy *= DAMPING;
    bx += vx;
    by += vy;

    // Hover lerp
    const hoverTarget = isHovering ? 1 : 0;
    hoverLerp += (hoverTarget - hoverLerp) * HOVER_LERP_SPEED;

    // Stretch (fades out as hover state grows)
    const speed       = Math.sqrt(vx * vx + vy * vy);
    const normalised  = Math.min(speed / MAX_SPEED, 1);
    const stretchAmt  = 1 - hoverLerp;
    let sx = 1 + normalised * (MAX_STRETCH - 1) * stretchAmt;
    let sy = 1 / sx * stretchAmt + 1 * (1 - stretchAmt);
    const angle = speed > 0.5 && stretchAmt > 0.05 ? Math.atan2(vy, vx) : 0;

    // Hover scale
    const uniformScale = 1 + hoverLerp * (HOVER_SCALE - 1);
    sx *= uniformScale;
    sy *= uniformScale;

    // Click compress
    if (isPressed) { sx *= 0.92; sy *= 0.92; }

    blob.style.transform = `translate(${bx}px, ${by}px) rotate(${angle}rad) scale(${sx}, ${sy})`;

    // Magnetic pull
    for (const t of magTargets) {
      const rect  = t.el.getBoundingClientRect();
      const natCx = rect.left + rect.width  / 2 - t.x;
      const natCy = rect.top  + rect.height / 2 - t.y;
      const dx    = mx - natCx;
      const dy    = my - natCy;
      const dist  = Math.sqrt(dx * dx + dy * dy);

      let tX = 0, tY = 0, tS = 1;
      if (dist < MAG_RADIUS) {
        const p = 1 - dist / MAG_RADIUS;
        tX = dx * p * MAG_STRENGTH;
        tY = dy * p * MAG_STRENGTH;
        tS = 1 + p * 0.10;
      }

      t.x     += (tX    - t.x)     * MAG_LERP;
      t.y     += (tY    - t.y)     * MAG_LERP;
      t.scale += (tS    - t.scale) * MAG_LERP;

      t.el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }
  };

  tick();

  // ── Visibility API ────────────────────────────────────────
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      tick();
    }
  });
})();
