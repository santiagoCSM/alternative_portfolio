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
    themeColor.content = dark ? "#161716" : "#f2f1ed";
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
  let previewsEnabled = true;

  function updatePreviews() {
    const enabled = previewsEnabled && !motion.matches;
    const list = grid.classList.contains("list-mode");
    videoToggle.hidden = list || motion.matches || !("IntersectionObserver" in window);
    videoToggle.setAttribute("aria-pressed", String(enabled));
    const nextVideo = enabled && !list && !document.hidden
      ? videos.find(video => visibleVideos.has(video) && !video.error)
      : null;
    for (const video of videos) {
      if (video !== nextVideo && !video.paused) video.pause();
    }
    if (nextVideo?.paused) {
      if (!nextVideo.hasAttribute("src")) nextVideo.src = nextVideo.dataset.src;
      nextVideo.play().catch(() => {});
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
      for (const event of ["pause", "error"]) {
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

  function cancelReveals() {
    for (const animation of grid.getAnimations?.({ subtree: true }) ?? []) {
      if (animation.id === "project-reveal") animation.cancel();
    }
  }
  motion.addEventListener("change", () => {
    if (motion.matches) cancelReveals();
  });

  function setView(view) {
    const list = view === "list";
    grid.classList.toggle("list-mode", list);
    if (list) cancelReveals();
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.view === view));
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
        if (!isIntersecting) {
          target.classList.add("awaiting-reveal");
          continue;
        }
        const wasPending = target.classList.contains("awaiting-reveal");
        target.classList.remove("awaiting-reveal");
        observer.unobserve(target);
        if (wasPending && !motion.matches && !grid.classList.contains("list-mode") && !target.matches(":target, :focus-within")) {
          target.querySelector(".project-visual").animate(
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "none" }
            ],
            { id: "project-reveal", duration: 1150, easing: revealEasing }
          );
          target.querySelector(".project-info").animate(
            [
              { opacity: 0, transform: "translateY(8px)" },
              { opacity: 1, transform: "none" }
            ],
            { id: "project-reveal", duration: 900, delay: 140, easing: revealEasing, fill: "backwards" }
          );
        }
      }
    }, { rootMargin: `0px 0px -${revealInset}px` });
    for (const project of grid.querySelectorAll(".reveal")) {
      observer.observe(project);
    }
  }
})();
