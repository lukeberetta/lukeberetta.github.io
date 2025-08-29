document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".app-main");
  if (!main) return;

  // Only enable on desktops/laptops (fine pointer & hover).
  const desktopLike = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!desktopLike) {
    document.body.classList.add("is-mobile");
    return; // Use native scroll on mobile
  }

  document.body.classList.remove("is-loading");

  const raf = (cb) =>
    (window.requestAnimationFrame || ((fn) => setTimeout(fn, 1000 / 60)))(cb);
  let lastY = -1,
    rafId = null;

  const setBodyHeight = () => {
    document.body.style.height = `${main.scrollHeight}px`;
  };

  const ro = new ResizeObserver(setBodyHeight);
  ro.observe(main);
  window.addEventListener("resize", setBodyHeight);

  const tick = () => {
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (y !== lastY) {
      lastY = y;
      const t = `translate3d(0, -${y}px, 0)`;
      main.style.transform = t;
    }
    rafId = raf(tick);
  };

  setBodyHeight();
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
    } else tick();
  });
});
