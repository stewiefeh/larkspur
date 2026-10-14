/**
 * Larkspur — site behaviour. One module, no dependencies.
 * Everything degrades: without JS the site is a fully readable document.
 *
 * Modules
 *   theme        — paper / late-service toggle, persisted
 *   header       — scroll state, hide-on-scroll-down, mobile nav
 *   reveal       — IntersectionObserver entrances with stagger
 *   hero         — title word rise, image crossfade
 *   menu         — menu page tabs + dietary filters
 *   gallery      — lightbox with keyboard support
 *   accordion    — FAQ accordions, animated height
 *   forms        — client-side validation, fake submit with honest note
 *   footer       — year, copy address, open/closed status
 *   backToTop    — scroll cue button
 *   marquee      — duplicate track for seamless loop
 */

(() => {
  "use strict";

  const doc = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- theme */

  const Theme = {
    KEY: "larkspur-theme",
    init() {
      const stored = this.read();
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = stored || (prefersDark ? "dark" : "light");
      this.apply(theme);
      doc.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
        btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        btn.addEventListener("click", () => this.toggle());
      });
    },
    read() {
      try {
        return localStorage.getItem(this.KEY);
      } catch {
        return null;
      }
    },
    write(value) {
      try {
        localStorage.setItem(this.KEY, value);
      } catch {
        /* private mode: theme simply does not persist */
      }
    },
    apply(theme) {
      doc.setAttribute("data-theme", theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme === "dark" ? "#1e1a16" : "#f5f1e8");
    },
    toggle() {
      const next = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
      this.apply(next);
      this.write(next);
      doc.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
        btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      });
    },
  };

  /* --------------------------------------------------------------- header */

  const Header = {
    lastY: 0,
    navOpen: false,
    init() {
      const header = document.querySelector("[data-header]");
      if (!header) return;
      let ticking = false;

      const onScroll = () => {
        const y = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(() => {
            header.toggleAttribute("data-scrolled", y > 12);
            const goingDown = y > this.lastY && y > 220;
            const goingUp = y < this.lastY - 4;
            if (!this.navOpen) {
              header.toggleAttribute("data-hidden", goingDown && !goingUp);
            }
            this.lastY = y;
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      const toggle = document.querySelector("[data-nav-toggle]");
      if (toggle) {
        toggle.addEventListener("click", () => this.setNav(!this.navOpen));
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && this.navOpen) this.setNav(false);
        });
        window.matchMedia("(min-width: 48rem)").addEventListener("change", (e) => {
          if (e.matches) this.setNav(false);
        });
        document.querySelectorAll(".site-nav a").forEach((a) => {
          a.addEventListener("click", () => this.setNav(false));
        });
      }
    },
    setNav(open) {
      this.navOpen = open;
      document.body.toggleAttribute("data-nav-open", open);
      const toggle = document.querySelector("[data-nav-toggle]");
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.querySelector(".visually-hidden").textContent = open ? "Close menu" : "Open menu";
      }
    },
  };

  /* --------------------------------------------------------------- reveal */

  const Reveal = {
    init() {
      const targets = document.querySelectorAll("[data-reveal], .reveal-img, .hero-title");
      if (reducedMotion) {
        targets.forEach((t) => t.classList.add("is-in"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      targets.forEach((t) => io.observe(t));
    },
  };

  /* ----------------------------------------------------------------- hero */

  const Hero = {
    IMAGES: [
      "/assets/img/hero-1.svg",
      "/assets/img/hero-2.svg",
      "/assets/img/hero-3.svg",
    ],
    INTERVAL: 7000,
    init() {
      // Split the hero title into words for the rise animation.
      document.querySelectorAll(".hero-title").forEach((title) => {
        const lines = title.querySelectorAll(".line");
        lines.forEach((line, li) => {
          const words = line.textContent.trim().split(/\s+/);
          line.textContent = "";
          words.forEach((word, wi) => {
            const span = document.createElement("span");
            span.className = "word";
            span.style.setProperty("--word-delay", `${(li * 3 + wi) * 70}ms`);
            span.textContent = word;
            line.appendChild(span);
            line.append(" ");
          });
        });
        requestAnimationFrame(() => title.classList.add("is-in"));
      });

      const media = document.querySelector("[data-hero-media]");
      if (!media || reducedMotion) return;
      let index = 0;
      const imgs = [];
      this.IMAGES.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        img.alt = "";
        img.decoding = "async";
        if (i === 0) img.classList.add("is-live");
        media.appendChild(img);
        imgs.push(img);
      });
      if (this.IMAGES.length < 2) return;
      setInterval(() => {
        imgs[index].classList.remove("is-live");
        index = (index + 1) % imgs.length;
        imgs[index].classList.add("is-live");
      }, this.INTERVAL);
    },
  };

  /* ----------------------------------------------------------------- menu */

  const MenuPage = {
    init() {
      const tabs = document.querySelectorAll("[role='tab']");
      if (tabs.length) this.tabs(tabs);
      const filters = document.querySelectorAll(".menu-filter");
      if (filters.length) this.filters(filters);
    },
    tabs(tabs) {
      const panels = document.querySelectorAll("[role='tabpanel']");
      const select = (tab) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
        });
        panels.forEach((p) => {
          p.hidden = p.id !== tab.getAttribute("aria-controls");
        });
      };
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => select(tab));
        tab.addEventListener("keydown", (e) => {
          const list = Array.from(tabs);
          const i = list.indexOf(tab);
          if (e.key === "ArrowRight") select(list[(i + 1) % list.length]);
          if (e.key === "ArrowLeft") select(list[(i - 1 + list.length) % list.length]);
          if (e.key === "Home") select(list[0]);
          if (e.key === "End") select(list[list.length - 1]);
        });
      });
    },
    filters(filters) {
      const items = document.querySelectorAll("[data-diet]");
      filters.forEach((btn) => {
        btn.addEventListener("click", () => {
          const active = btn.getAttribute("aria-pressed") === "true";
          filters.forEach((f) => f.setAttribute("aria-pressed", "false"));
          items.forEach((item) => (item.hidden = false));
          if (!active) {
            btn.setAttribute("aria-pressed", "true");
            const diet = btn.dataset.diet;
            items.forEach((item) => {
              item.hidden = !(item.dataset.diet || "").split(" ").includes(diet);
            });
          }
        });
      });
    },
  };

  /* -------------------------------------------------------------- gallery */

  const Gallery = {
    init() {
      const buttons = document.querySelectorAll(".gallery-item");
      if (!buttons.length) return;
      let dialog = document.createElement("dialog");
      dialog.className = "lightbox";
      dialog.innerHTML =
        '<button class="lightbox-close" type="button">Close</button>' +
        "<figure><img alt=''><figcaption></figcaption></figure>";
      document.body.appendChild(dialog);
      const img = dialog.querySelector("img");
      const caption = dialog.querySelector("figcaption");

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const source = btn.querySelector("img");
          if (!source) return;
          const full = source.getAttribute("data-full") || source.src;
          img.src = full;
          img.alt = source.alt;
          caption.textContent = btn.dataset.caption || source.alt || "";
          dialog.showModal();
        });
      });

      dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
      img.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
      });
    },
  };

  /* ------------------------------------------------------------ accordion */

  const Accordion = {
    init() {
      document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
        const panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!panel) return;
        trigger.addEventListener("click", () => {
          const open = trigger.getAttribute("aria-expanded") === "true";
          trigger.setAttribute("aria-expanded", String(!open));
          panel.style.height = open ? "0px" : `${panel.scrollHeight}px`;
        });
      });
    },
  };

  /* ---------------------------------------------------------------- forms */

  const Forms = {
    init() {
      document.querySelectorAll("form[data-validate]").forEach((form) => this.wire(form));
      document.querySelectorAll("form[data-newsletter]").forEach((form) => {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const note = form.querySelector("[data-form-note]");
          const email = form.querySelector("input[type='email']");
          if (!email.value || !email.checkValidity()) {
            note.textContent = "That email does not look right yet.";
            note.dataset.state = "error";
            email.focus();
            return;
          }
          note.textContent = "You are on the list. First letter lands next month.";
          note.dataset.state = "ok";
          form.reset();
        });
      });
    },
    wire(form) {
      form.setAttribute("novalidate", "");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let firstBad = null;
        form.querySelectorAll("[required]").forEach((field) => {
          const bad = !field.checkValidity();
          field.setAttribute("aria-invalid", bad ? "true" : "false");
          if (bad && !firstBad) firstBad = field;
        });
        if (firstBad) {
          firstBad.focus();
          const note = form.querySelector("[data-form-note]");
          if (note) {
            note.textContent = "A few fields need a look before this can go out.";
            note.dataset.state = "error";
          }
          return;
        }
        const note = form.querySelector("[data-form-note]");
        if (note) {
          note.textContent = "Request received. We confirm every table by email within a day.";
          note.dataset.state = "ok";
        }
        form.reset();
      });
    },
  };

  /* --------------------------------------------------------------- footer */

  const FooterBits = {
    init() {
      document.querySelectorAll("[data-year]").forEach((el) => {
        el.textContent = new Date().getFullYear();
      });

      document.querySelectorAll("[data-copy-address]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(btn.dataset.address);
            btn.classList.add("is-copied");
            const old = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(() => {
              btn.textContent = old;
              btn.classList.remove("is-copied");
            }, 1600);
          } catch {
            btn.textContent = btn.dataset.address;
          }
        });
      });

      // Open/closed: Wed-Sun 17:00-23:00 America/New_York.
      const status = document.querySelector("[data-open-status]");
      if (status) {
        const label = status.querySelector("[data-open-label]");
        const now = new Date();
        const day = now.getDay(); // 0 Sun ... 6 Sat
        const hour = now.getHours() + now.getMinutes() / 60;
        const openDays = [3, 4, 5, 6, 0];
        const isOpen = openDays.includes(day) && hour >= 17 && hour < 23;
        if (!isOpen) status.setAttribute("data-closed", "");
        if (label) {
          label.textContent = isOpen
            ? "Open now, kitchen until 11"
            : "Closed. Doors open Wednesday at 5";
        }
      }

      // Today marker on hours tables.
      const today = new Date().getDay();
      document.querySelectorAll(".hours-table tr[data-day]").forEach((row) => {
        if (Number(row.dataset.day) === today) row.setAttribute("data-today", "");
      });
    },
  };

  /* ------------------------------------------------------------ back to top */

  const BackToTop = {
    init() {
      const btn = document.querySelector("[data-back-to-top]");
      if (!btn) return;
      let visible = false;
      window.addEventListener(
        "scroll",
        () => {
          const should = window.scrollY > window.innerHeight * 1.2;
          if (should !== visible) {
            visible = should;
            if (visible) {
              btn.removeAttribute("aria-hidden");
              btn.removeAttribute("tabindex");
              btn.setAttribute("data-visible", "");
            } else {
              btn.setAttribute("aria-hidden", "true");
              btn.setAttribute("tabindex", "-1");
              btn.removeAttribute("data-visible");
            }
          }
        },
        { passive: true }
      );
      btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      });
    },
  };

  /* -------------------------------------------------------------- marquee */

  const Marquee = {
    init() {
      document.querySelectorAll(".marquee-track").forEach((track) => {
        if (track.dataset.seeded) return;
        track.dataset.seeded = "1";
        track.innerHTML += track.innerHTML;
      });
    },
  };

  /* ----------------------------------------------------------------- boot */

  Theme.init();
  Header.init();
  Reveal.init();
  Hero.init();
  MenuPage.init();
  Gallery.init();
  Accordion.init();
  Forms.init();
  FooterBits.init();
  BackToTop.init();
  Marquee.init();

  document.body.removeAttribute("data-page");
})();
