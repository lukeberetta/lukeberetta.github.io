document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".app-main");
  if (!main) return;

  const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!isDesktop) {
    document.body.classList.add("is-mobile");
    return;
  }

  let lastY = -1;
  let rafId = null;

  const setBodyHeight = () => {
    document.body.style.height = `${main.scrollHeight}px`;
  };

  const ro = new ResizeObserver(setBodyHeight);
  ro.observe(main);
  window.addEventListener("resize", setBodyHeight);

  const tick = () => {
    const y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      main.style.transform = `translate3d(0, -${y}px, 0)`;
    }
    rafId = requestAnimationFrame(tick);
  };

  setBodyHeight();
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      tick();
    }
  });
});
