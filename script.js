(() => {
  "use strict";
  const grid = document.querySelector("#project-grid");
  const buttons = [...document.querySelectorAll("[data-view]")];
  const videoToggle = document.querySelector("#video-toggle");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const previewThreshold = 0.35;
  const videos = [...grid.querySelectorAll("video")];
  const visibleVideos = new Set();
  let previewsEnabled = !motion.matches;

  function updatePreviews() {
    const enabled = previewsEnabled && !motion.matches;
    const list = grid.classList.contains("list-mode");
    videoToggle.hidden = list || motion.matches || !("IntersectionObserver" in window);
    videoToggle.setAttribute("aria-pressed", String(enabled));
    for (const video of videos) {
      if (enabled && !list && !document.hidden && visibleVideos.has(video)) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }

  if ("IntersectionObserver" in window) {
    const previewObserver = new IntersectionObserver(entries => {
      for (const { target, intersectionRatio } of entries) {
        if (intersectionRatio >= previewThreshold) visibleVideos.add(target);
        else visibleVideos.delete(target);
      }
      updatePreviews();
    }, { threshold: previewThreshold });
    for (const video of videos) {
      video.muted = true;
      const visual = video.closest(".project-visual");
      video.addEventListener("playing", () => visual.classList.add("is-playing"));
      for (const event of ["pause", "waiting", "error"]) {
        video.addEventListener(event, () => visual.classList.remove("is-playing"));
      }
      previewObserver.observe(video);
    }
    videoToggle.addEventListener("click", () => {
      previewsEnabled = !previewsEnabled;
      updatePreviews();
    });
    motion.addEventListener("change", updatePreviews);
    document.addEventListener("visibilitychange", updatePreviews);
  }
  updatePreviews();
  function setView(view) {
    const list = view === "list";
    grid.classList.toggle("list-mode", list);
    for (const button of buttons) {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    updatePreviews();
  }
  buttons.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  const indexLinks = [...document.querySelectorAll(".work-index a")];
  const updateCurrentProject = () => {
    for (const link of indexLinks) {
      if (link.hash === window.location.hash) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  window.addEventListener("hashchange", updateCurrentProject);
  updateCurrentProject();
  document.querySelector("#project-count").textContent = String(grid.querySelectorAll(".project").length).padStart(2, "0");
  document.querySelector("#year").textContent = new Date().getFullYear();
  const items = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    }, { threshold: 0.08 });
    items.forEach(item => observer.observe(item));
  } else {
    items.forEach(item => item.classList.add("visible"));
  }

  // Ajuste final según el ancho disponible: evita títulos recortados.
  const heroTitle = document.querySelector("#hero-title");
  if (heroTitle) {
    const fitHero = () => {
      heroTitle.style.removeProperty("font-size");
      const base = parseFloat(getComputedStyle(heroTitle).fontSize);
      const factors = [...heroTitle.querySelectorAll(".hero-line")].map(line => {
        const inner = line.querySelector(".hero-line-inner");
        const style = getComputedStyle(line);
        const available = line.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 4;
        const actual = inner.getBoundingClientRect().width;
        return actual > 0 ? Math.min(1, available / actual) : 1;
      });
      const factor = Math.min(...factors);
      if (factor < 1) heroTitle.style.fontSize = (base * factor * .98).toFixed(2) + "px";
    };
    fitHero();
    window.addEventListener("resize", fitHero, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(fitHero);
  }
})();
