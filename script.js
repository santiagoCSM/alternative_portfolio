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
  const heroSymbol = document.querySelector(".hero-symbol");
  let symbolFrame = null;

  function updateSymbolRotation() {
    symbolFrame = null;
    const progress = Math.min(1, Math.max(0, window.scrollY / 420));
    heroSymbol.style.setProperty("--symbol-rotation", `${progress * 240}deg`);
  }

  function scheduleSymbolRotation() {
    if (symbolFrame === null) symbolFrame = requestAnimationFrame(updateSymbolRotation);
  }

  function syncSymbolMotion() {
    if (motion.matches) {
      window.removeEventListener("scroll", scheduleSymbolRotation);
      if (symbolFrame !== null) cancelAnimationFrame(symbolFrame);
      symbolFrame = null;
      heroSymbol.style.removeProperty("--symbol-rotation");
    } else {
      window.addEventListener("scroll", scheduleSymbolRotation, { passive: true });
      scheduleSymbolRotation();
    }
  }
  motion.addEventListener("change", syncSymbolMotion);
  syncSymbolMotion();

  const mobilePreview = window.matchMedia("(max-width: 650px)");
  const previewThreshold = 0.35;
  const projectTrack = grid.closest(".project-track");
  const workLayout = projectTrack.closest(".work-layout");
  const projects = [...grid.querySelectorAll(".project")];
  const indexLinks = [...document.querySelectorAll(".work-index a")];
  const sceneControls = grid.querySelector(".scene-controls");
  const scenePosition = grid.querySelector(".scene-position");
  const sceneButtons = [...sceneControls.querySelectorAll("button")];
  const shortViewport = window.matchMedia("(max-height: 450px)");
  const lastProject = projects.length - 1;
  let sceneIndex = -1;
  let sceneFrame = null;
  let displayedPosition = null;
  let previousSceneTime = null;
  const videos = [...grid.querySelectorAll("video")];
  const playButtons = new Map(videos.map(video => [video, video.closest(".project-media").querySelector(".preview-play")]));
  const visibleVideos = new Set();
  const failedWebm = new WeakSet();
  let sceneVisible = false;
  let previewsEnabled = true;
  let activePreview = null;

  function sourceFor(video) {
    if (!mobilePreview.matches) return video.dataset.src;
    const webm = video.dataset.mobileWebm;
    if (webm && !failedWebm.has(video) && !video.canPlayType('video/mp4; codecs="avc1.64001f"')) return webm;
    return video.dataset.mobileSrc;
  }

  function playPreview(video) {
    const source = video.getAttribute("src");
    video.play().catch(error => {
      if (error.name === "NotAllowedError" && video === activePreview && video.paused && video.getAttribute("src") === source) {
        playButtons.get(video).hidden = false;
      }
    });
  }

  function updatePreviews() {
    const enabled = previewsEnabled && !motion.matches;
    const list = grid.classList.contains("list-mode");
    videoToggle.hidden = list || motion.matches || !("IntersectionObserver" in window);
    videoToggle.setAttribute("aria-pressed", String(enabled));
    const candidates = sceneIndex < 0 ? videos : [videos[sceneIndex]];
    activePreview = enabled && !list && !document.hidden
      ? candidates.find(video => (sceneIndex < 0 ? visibleVideos.has(video) : sceneVisible) &&
        (!video.error || video.getAttribute("src") !== sourceFor(video))) ?? null
      : null;
    for (const video of videos) {
      if (video === activePreview) continue;
      if (!video.paused) video.pause();
      playButtons.get(video).hidden = true;
    }
    const nextVideo = activePreview;
    if (nextVideo) {
      const source = sourceFor(nextVideo);
      const button = playButtons.get(nextVideo);
      if (nextVideo.getAttribute("src") !== source) {
        nextVideo.closest(".project-visual").classList.remove("is-playing");
        button.hidden = true;
        nextVideo.src = source;
      }
      if (nextVideo.paused && button.hidden) playPreview(nextVideo);
    }
  }

  if ("IntersectionObserver" in window) {
    const previewObserver = new IntersectionObserver(entries => {
      for (const { target, intersectionRatio } of entries) {
        if (target === grid) sceneVisible = intersectionRatio >= previewThreshold;
        else if (intersectionRatio >= previewThreshold) visibleVideos.add(target);
        else visibleVideos.delete(target);
      }
      updatePreviews();
    }, { threshold: previewThreshold });
    previewObserver.observe(grid);
    for (const video of videos) {
      video.muted = true;
      video.playsInline = true;
      const visual = video.closest(".project-visual");
      const button = playButtons.get(video);
      button.addEventListener("click", () => {
        if (video === activePreview) playPreview(video);
      });
      video.addEventListener("playing", () => {
        visual.classList.add("is-playing");
        if (document.activeElement === button) visual.focus({ preventScroll: true });
        button.hidden = true;
      });
      for (const event of ["pause", "error"]) {
        video.addEventListener(event, () => visual.classList.remove("is-playing"));
      }
      video.addEventListener("error", () => {
        if (video.getAttribute("src") === video.dataset.mobileWebm) {
          failedWebm.add(video);
        }
        updatePreviews();
      });
      previewObserver.observe(video);
    }
    videoToggle.addEventListener("click", () => {
      previewsEnabled = !previewsEnabled;
      updatePreviews();
    });
    motion.addEventListener("change", updatePreviews);
    mobilePreview.addEventListener("change", updatePreviews);
    document.addEventListener("visibilitychange", updatePreviews);
  }
  updatePreviews();

  function markCurrentProject() {
    const hash = sceneIndex < 0 ? location.hash : `#${projects[sceneIndex].id}`;
    for (const link of indexLinks) {
      if (link.hash === hash) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }

  function sceneGeometry() {
    return {
      top: parseFloat(getComputedStyle(grid).top),
      travel: projectTrack.offsetHeight - grid.offsetHeight
    };
  }

  function renderScene(time) {
    sceneFrame = null;
    const { top, travel } = sceneGeometry();
    const progress = Math.min(1, Math.max(0, (top - projectTrack.getBoundingClientRect().top) / travel));
    const target = progress * lastProject;
    const elapsed = previousSceneTime === null ? 16 : Math.min(time - previousSceneTime, 50);
    const blend = 1 - Math.exp(-elapsed / 95);
    const gap = target - (displayedPosition ?? target);
    if (Math.abs(gap) < .002) {
      displayedPosition = target;
      previousSceneTime = null;
    } else {
      displayedPosition += gap * blend;
      previousSceneTime = time;
      scheduleScene();
    }
    const position = displayedPosition;
    const nextIndex = Math.round(position);
    const shift = mobilePreview.matches ? 61 : 76;

    for (const [index, project] of projects.entries()) {
      const distance = index - position;
      const depth = Math.abs(distance);
      const side = index % 2 === 0 ? 1 : -1;
      const x = distance * shift;
      const z = distance < 0 ? distance * -160 : distance * -410;
      project.style.setProperty("--plane-transform", `translate3d(${x}%, ${side * Math.min(depth * 5, 9)}%, ${z}px) rotateY(${distance * -18}deg)`);
      project.style.setProperty("--plane-opacity", Math.max(0, 1 - depth * (distance < 0 ? 1.12 : .62)));
    }

    if (nextIndex === sceneIndex) return;
    if (projects[sceneIndex]?.contains(document.activeElement)) {
      sceneButtons[1].focus({ preventScroll: true });
    }
    sceneIndex = nextIndex;
    grid.dataset.sceneProject = nextIndex;
    projects.forEach((project, index) => { project.inert = index !== nextIndex; });
    scenePosition.textContent = `${String(nextIndex + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
    sceneButtons[0].setAttribute("aria-disabled", String(nextIndex === 0));
    sceneButtons[1].setAttribute("aria-disabled", String(nextIndex === lastProject));
    markCurrentProject();
    updatePreviews();
  }

  function scheduleScene() {
    if (sceneFrame === null) sceneFrame = requestAnimationFrame(renderScene);
  }

  function syncGalleryMotion() {
    const enabled = !motion.matches && !shortViewport.matches && !grid.classList.contains("list-mode");
    workLayout.classList.toggle("scene-layout", enabled);
    projectTrack.classList.toggle("scene-track", enabled);
    sceneControls.hidden = !enabled;
    if (enabled) {
      window.addEventListener("scroll", scheduleScene, { passive: true });
      window.addEventListener("resize", scheduleScene);
      scheduleScene();
    } else {
      window.removeEventListener("scroll", scheduleScene);
      window.removeEventListener("resize", scheduleScene);
      if (sceneFrame !== null) cancelAnimationFrame(sceneFrame);
      sceneFrame = null;
      sceneIndex = -1;
      displayedPosition = null;
      previousSceneTime = null;
      projects.forEach(project => { project.inert = false; });
      markCurrentProject();
      updatePreviews();
    }
  }

  function goToProject(index, behavior) {
    const { top, travel } = sceneGeometry();
    window.scrollTo({
      top: window.scrollY + projectTrack.getBoundingClientRect().top - top + travel * index / lastProject,
      behavior
    });
  }

  function openSceneProject(index) {
    const hash = `#${projects[index].id}`;
    if (location.hash !== hash) history.pushState(null, "", hash);
    goToProject(index, "smooth");
  }

  function syncProjectHash() {
    const index = projects.findIndex(project => `#${project.id}` === location.hash);
    if (projectTrack.classList.contains("scene-track") && index >= 0) {
      displayedPosition = null;
      goToProject(index, "instant");
      scheduleScene();
    }
    markCurrentProject();
  }

  indexLinks.forEach(link => link.addEventListener("click", event => {
    if (sceneIndex < 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = projects.findIndex(project => `#${project.id}` === link.hash);
    if (index < 0) return;
    event.preventDefault();
    openSceneProject(index);
  }));
  sceneButtons.forEach(button => button.addEventListener("click", () => {
    if (button.getAttribute("aria-disabled") !== "true") {
      openSceneProject(sceneIndex + Number(button.dataset.sceneStep));
    }
  }));
  motion.addEventListener("change", syncGalleryMotion);
  shortViewport.addEventListener("change", syncGalleryMotion);
  window.addEventListener("hashchange", syncProjectHash);
  window.addEventListener("load", syncProjectHash, { once: true });
  projectTrack.style.setProperty("--scene-steps", lastProject);
  projects.forEach((project, index) => project.style.setProperty("--plane-order", projects.length - index));
  syncGalleryMotion();

  function setView(view) {
    const list = view === "list";
    grid.classList.toggle("list-mode", list);
    syncGalleryMotion();
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.view === view));
    }
    updatePreviews();
  }
  buttons.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelector("#project-count").textContent = String(projects.length).padStart(2, "0");
  document.querySelector("#year").textContent = new Date().getFullYear();
})();
