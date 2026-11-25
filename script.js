(() => {
  "use strict";
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  let savedTheme;
  try { savedTheme = localStorage.getItem("portfolio-theme"); } catch {}

  function applyTheme() {
    const dark = savedTheme === "dark" || (savedTheme !== "light" && systemTheme.matches);
    root.dataset.theme = dark ? "dark" : "light";
    themeColor.content = getComputedStyle(root).getPropertyValue("--paper").trim();
    themeToggle.setAttribute("aria-pressed", String(dark));
  }

  themeToggle.addEventListener("click", () => {
    savedTheme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("portfolio-theme", savedTheme); } catch {}
    applyTheme();
  });
  systemTheme.addEventListener("change", applyTheme);
  applyTheme();
  themeToggle.hidden = false;

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
  if ("IntersectionObserver" in window && typeof Element.prototype.animate === "function" && !motion.matches) {
    const revealEasing = "cubic-bezier(.42, 0, .34, 1)";
    const revealInset = 48;
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.remove("awaiting-reveal");
        observer.unobserve(target);
        if (!motion.matches && !grid.classList.contains("list-mode") && !target.matches(":target, :focus-within")) {
          target.querySelector(".project-visual").animate(
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "none" }
            ],
            { duration: 1150, easing: revealEasing }
          );
          target.querySelector(".project-info").animate(
            [
              { opacity: 0, transform: "translateY(8px)" },
              { opacity: 1, transform: "none" }
            ],
            { duration: 900, delay: 140, easing: revealEasing, fill: "backwards" }
          );
        }
      }
    }, { rootMargin: `0px 0px -${revealInset}px` });
    for (const project of grid.querySelectorAll(".reveal")) {
      if (project.getBoundingClientRect().top < window.innerHeight - revealInset) continue;
      project.classList.add("awaiting-reveal");
      observer.observe(project);
    }
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
