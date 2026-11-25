# Alternative Portfolio

Portafolio experimental de Santiago. **Primera iteración de diseño**, inspirada en el enfoque editorial, la tipografía de gran escala, las retículas y los movimientos sutiles de [Obys Agency](https://obys.agency/).

Esta es una interpretación original para seguir iterando: **no es una copia del código, las imágenes, las fuentes propietarias o la identidad de Obys**.

## Qué incluye

- Hero tipográfico, diseño monocromático y grilla editorial.
- Archivo de proyectos con modos **Grid/List**.
- Gráficos abstractos originales hechos con CSS (sin imágenes pesadas).
- Secciones Work, About y Contact.
- Animaciones progresivas con `IntersectionObserver`, accesibilidad básica y respeto a `prefers-reduced-motion`.
- Diseño responsivo, sin frameworks ni bundler.

## Tecnologías

- HTML5
- CSS3
- JavaScript (vanilla)
- Google Fonts: Inter, DM Mono (fallbacks del sistema)

## Archivos

```
index.html
styles.css
script.js
README.md
```

## Probar en local

```bash
python3 -m http.server 4173
```

Abre http://localhost:4173

GitHub Pages puede publicarse desde `main` → `/ (root)` en Settings → Pages.

## Próximos cambios

Contenido y casos reales, adaptación de colores/tipografías, overlays de proyectos, motion design y evaluación de rendimiento en móviles.

---

## English

An experimental developer portfolio inspired by Obys Agency's editorial direction: large typography, grids, whitespace and subtle motion. This is **an original, lightweight starting point**, not a reproduction of proprietary assets or source code.

Built with HTML, CSS and vanilla JavaScript. Includes responsive layouts, grid/list work browsing, CSS-only artwork, accessible navigation and reduced-motion support.

Run locally with `python3 -m http.server 4173`; optionally deploy using GitHub Pages from `main`.
