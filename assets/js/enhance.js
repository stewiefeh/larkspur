/**
 * Larkspur — progressive enhancement layer.
 * Ships only behaviors that make the site nicer when available and disappear
 * entirely when the platform says no: scroll progress, page transitions via
 * the View Transitions API, smooth anchor awareness, an idle-time easter egg
 * on the colophon, and a tiny service-free "session clock" in the footer for
 * late-night diners.
 */

(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------- scroll progress bar */

  const Progress = {
    init() {
      if (reduced) return;
      const bar = document.createElement("div");
      bar.className = "scroll-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
      let raf = null;
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? window.scrollY / max : 0;
        bar.style.transform = `scaleX(${pct})`;
        raf = null;
      };
      window.addEventListener("scroll", () => {
        if (!raf) raf = requestAnimationFrame(update);
      }, { passive: true });
      update();
    },
  };

  /* ------------------------------------------------------ view transitions */

  const Transitions = {
    init() {
      if (!document.startViewTransition || reduced) return;
      // Cross-fade internal navigations without intercepting modified clicks.
      document.addEventListener("click", (e) => {
        const link = e.target.closest("a[href]");
        if (!link || !link.origin || link.origin !== location.origin) return;
        if (link.target === "_blank" || link.hasAttribute("download")) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (link.getAttribute("href").startsWith("#")) return;
        e.preventDefault();
        document.startViewTransition(() => {
          location.href = link.href;
        });
      });
      // Name the hero so old/new pages cross-fade around it cleanly.
      const hero = document.querySelector(".hero");
      if (hero) hero.style.viewTransitionName = "hero";
      const header = document.querySelector(".site-header");
      if (header) header.style.viewTransitionName = "header";
    },
  };

  /* ------------------------------------------------- anchor offset smoothing */

  const Anchors = {
    init() {
      // Account for the fixed header on hash navigation; CSS scroll-padding
      // covers most cases, this catches in-page links added after load.
      document.addEventListener("click", (e) => {
        const a = e.target.closest("a[href^='#']");
        if (!a) return;
        const id = a.getAttribute("href").slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    },
  };

  /* ------------------------------------------------------------ night mode */

  const NightWatch = {
    init() {
      // After 10pm local, the default theme is "late service" unless the
      // reader already picked one. Purely a default; the toggle wins always.
      try {
        if (localStorage.getItem("larkspur-theme")) return;
      } catch {
        return;
      }
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 5) {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    },
  };

  /* --------------------------------------------------------- konami larkspur */

  const Secret = {
    CODE: ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],
    init() {
      let pos = 0;
      document.addEventListener("keydown", (e) => {
        if (e.key === this.CODE[pos]) {
          pos += 1;
          if (pos === this.CODE.length) {
            pos = 0;
            this.bloom();
          }
        } else {
          pos = e.key === this.CODE[0] ? 1 : 0;
        }
      });
    },
    bloom() {
      // A handful of larkspur blossoms drift up the viewport once.
      if (reduced) return;
      const colors = ["#8b8f6f", "#7d81a8", "#a8a2c9", "#98a06e"];
      for (let i = 0; i < 24; i++) {
        const petal = document.createElement("div");
        petal.textContent = "❀";
        petal.style.cssText = [
          "position:fixed",
          "z-index:999",
          "pointer-events:none",
          "font-size:" + (10 + Math.random() * 18) + "px",
          "color:" + colors[i % colors.length],
          "left:" + Math.random() * 100 + "vw",
          "top:105vh",
          "opacity:.85",
          "transition:transform 4s linear, opacity 4s linear",
        ].join(";");
        document.body.appendChild(petal);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            petal.style.transform = `translateY(-115vh) rotate(${(Math.random() * 2 - 1) * 220}deg)`;
            petal.style.opacity = "0";
          });
        });
        setTimeout(() => petal.remove(), 4200);
      }
    },
  };

  /* ------------------------------------------------------------ session clock */

  const ServiceClock = {
    init() {
      const slot = document.querySelector(".footer-hours [data-open-label]");
      if (!slot) return;
      // Subtle: append a tiny service-hours note in the footer only, and
      // only after it is already open or just about to be.
      const now = new Date();
      const mins = now.getMinutes();
      const label = document.createElement("span");
      label.className = "service-clock";
      label.style.fontSize = "0.72rem";
      label.style.opacity = "0.75";
      const hh = ((now.getHours() + 11) % 12) + 1;
      const mm = String(mins).padStart(2, "0");
      label.textContent = ` · ${hh}:${mm} ${now.getHours() >= 12 ? "pm" : "am"} in the room right now`;
      if (document.querySelector("[data-open-status]")) {
        slot.after(label);
      }
    },
  };

  Progress.init();
  Transitions.init();
  Anchors.init();
  NightWatch.init();
  Secret.init();
  ServiceClock.init();
})();
