(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  // ── DOM setup ─────────────────────────────────────────────
  const blob = document.createElement("div");
  blob.className = "cursor-blob";
  document.body.appendChild(blob);
  document.body.classList.add("cursor-active");

  blob.style.marginLeft = "-20px";
  blob.style.marginTop = "-20px";

  // ── State ─────────────────────────────────────────────────
  let mx = -100, my = -100;
  let bx = -100, by = -100;
  let vx = 0, vy = 0;

  let isVisible = false;
  let isHovering = false;
  let isPressed = false;
  let rafId = null;

  let hoverLerp = 0;

  // Track previous cursor position to detect when physics have settled
  let prevMx = -100, prevMy = -100;

  // ── Magnetic elements ─────────────────────────────────────
  const MAG_RADIUS = 60;
  const MAG_RADIUS_SQ = MAG_RADIUS * MAG_RADIUS;
  const MAG_STRENGTH = 0.38;
  const MAG_LERP = 0.10;

  const magTargets = [
    ...[...document.querySelectorAll(".back-link, .project-icon, .project-folder-icon")]
      .map(el => ({ el, x: 0, y: 0, cx: 0, cy: 0, scale: 1, rotated: false })),
    ...[...document.querySelectorAll(".nav-link")]
      .map(el => ({ el, x: 0, y: 0, cx: 0, cy: 0, scale: 1, rotated: true })),
  ];

  // ── Physics constants ─────────────────────────────────────
  // Apple feel: snappy follow, fast settle, subtle stretch
  const SPRING = 0.16;
  const DAMPING = 0.65;
  const MAX_SPEED = 20;
  const MAX_STRETCH = 1.2;
  const HOVER_SCALE = 2;
  const HOVER_LERP_SPEED = 0.12;

  // ── Grid glow ─────────────────────────────────────────────
  const gridGlow = document.getElementById("grid-overlay-glow");

  // ── Cache magnetic target positions ───────────────────────
  // We subtract the current translation offset (t.x, t.y) because
  // getBoundingClientRect reflects the post-transform visual position.
  // Re-cached on scroll/resize since those change element positions.
  function cachePositions() {
    for (const t of magTargets) {
      const rect = t.el.getBoundingClientRect();
      t.cx = rect.left + rect.width / 2 - t.x;
      t.cy = rect.top + rect.height / 2 - t.y;
    }
  }
  cachePositions();
  window.addEventListener("scroll", cachePositions, { passive: true });
  window.addEventListener("resize", cachePositions, { passive: true });

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
  document.addEventListener("mousedown", () => { isPressed = true; });
  document.addEventListener("mouseup", () => { isPressed = false; });

  // ── Click ripple ──────────────────────────────────────────
  document.addEventListener("click", (e) => {
    const ripple = document.createElement("div");
    ripple.className = "cursor-ripple";
    ripple.style.left = e.clientX + "px";
    ripple.style.top = e.clientY + "px";
    document.body.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });

  // ── rAF loop ──────────────────────────────────────────────
  const tick = () => {
    rafId = requestAnimationFrame(tick);
    if (!isVisible) return;

    // ── Settled check ─────────────────────────────────────
    // Skip all computation and DOM writes when nothing is changing.
    // This is the main performance win for slow devices: when the
    // cursor is still and physics have decayed, the loop is free.
    const moved = mx !== prevMx || my !== prevMy;
    prevMx = mx; prevMy = my;

    const hoverTarget = isHovering ? 1 : 0;
    const vSettled = Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01;
    const hSettled = Math.abs(hoverTarget - hoverLerp) < 0.005;
    const mSettled = magTargets.every(t => Math.abs(t.x) < 0.05 && Math.abs(t.y) < 0.05);

    if (!moved && vSettled && hSettled && mSettled) return;

    // ── COMPUTE PHASE ─────────────────────────────────────
    // Spring physics
    vx += (mx - bx) * SPRING;
    vy += (my - by) * SPRING;
    vx *= DAMPING;
    vy *= DAMPING;
    bx += vx;
    by += vy;

    // Hover lerp
    hoverLerp += (hoverTarget - hoverLerp) * HOVER_LERP_SPEED;

    // Stretch (fades out as hover state grows)
    const speed = Math.sqrt(vx * vx + vy * vy);
    const normalised = Math.min(speed / MAX_SPEED, 1);
    const stretchAmt = 1 - hoverLerp;
    let sx = 1 + normalised * (MAX_STRETCH - 1) * stretchAmt;
    let sy = 1 / sx * stretchAmt + 1 * (1 - stretchAmt);
    const angle = speed > 0.5 && stretchAmt > 0.05 ? Math.atan2(vy, vx) : 0;

    // Hover scale
    const uniformScale = 1 + hoverLerp * (HOVER_SCALE - 1);
    sx *= uniformScale;
    sy *= uniformScale;

    // Click compress
    if (isPressed) { sx *= 0.92; sy *= 0.92; }

    // Magnetic pull calculations
    // Use squared distance to avoid Math.sqrt on every target every frame;
    // only compute the actual distance when the cursor is within range.
    for (const t of magTargets) {
      const dx = mx - t.cx;
      const dy = my - t.cy;
      const distSq = dx * dx + dy * dy;

      let tX = 0, tY = 0, tS = 1;
      if (distSq < MAG_RADIUS_SQ) {
        const dist = Math.sqrt(distSq);
        const p = 1 - dist / MAG_RADIUS;
        // Nav links live inside a rotate(-90deg) parent, so local axes are
        // swapped: local X = screen up, local Y = screen right.
        // Convert screen-space pull (dx, dy) to local coords: (-dy, dx).
        tX = (t.rotated ? -dy : dx) * p * MAG_STRENGTH;
        tY = (t.rotated ? dx : dy) * p * MAG_STRENGTH;
        tS = 1 + p * 0.10;
      }

      t.x += (tX - t.x) * MAG_LERP;
      t.y += (tY - t.y) * MAG_LERP;
      t.scale += (tS - t.scale) * MAG_LERP;
    }

    // ── WRITE PHASE (all DOM writes at end) ───────────────
    blob.style.transform = `translate(${bx}px, ${by}px) rotate(${angle}rad) scale(${sx * 0.5}, ${sy * 0.5})`;
    blob.style.setProperty("--counter-angle", `${-angle}rad`);

    for (const t of magTargets) {
      t.el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }

    // Grid glow vars are updated here (throttled to display refresh rate)
    // rather than in the mousemove handler, which can fire faster than rAF.
    if (gridGlow) {
      gridGlow.style.setProperty("--cx", mx + "px");
      gridGlow.style.setProperty("--cy", my + "px");
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
