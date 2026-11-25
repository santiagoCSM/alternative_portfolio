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
})();