(() => {
  "use strict";
  const grid = document.querySelector("#project-grid");
  const buttons = [...document.querySelectorAll("[data-view]")];
  function setView(view) {
    const list = view === "list";
    grid.classList.toggle("list-mode", list);
    for (const button of buttons) {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }
  buttons.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
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

  // The longest headline line sets a safe common font size for the entire hero.
  // Recompute after web fonts load and on resize so no word is clipped.
  const heroTitle = document.querySelector("#hero-title");
  if (heroTitle) {
    const fitHero = () => {
      heroTitle.style.removeProperty("font-size");
      const baseSize = parseFloat(getComputedStyle(heroTitle).fontSize);
      let ratio = 1;
      for (const line of heroTitle.querySelectorAll(".hero-line")) {
        const text = line.querySelector(".hero-line-inner");
        if (!text) continue;
        const style = getComputedStyle(line);
        const available = line.clientWidth
          - parseFloat(style.paddingLeft)
          - parseFloat(style.paddingRight)
          - 4;
        const width = text.getBoundingClientRect().width;
        if (width > 0 && available > 0) ratio = Math.min(ratio, available / width);
      }
      if (ratio < 1) heroTitle.style.fontSize = (baseSize * ratio * .98).toFixed(2) + "px";
    };
    fitHero();
    window.addEventListener("resize", fitHero, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
  }
})();