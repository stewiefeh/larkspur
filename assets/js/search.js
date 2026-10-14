/**
 * Larkspur — client-side site search.
 * A small local index of every page, a full-screen search sheet, keyboard
 * navigation (arrows, enter, escape, "/" to open), and highlighted snippets.
 * No dependencies, no server, no network requests.
 */

(() => {
  "use strict";

  const INDEX = [
    { url: "/", title: "Larkspur, home", kind: "Page",
      text: "Seasonal kitchen and bar Cold Spring Hudson hearth tasting menu reservation valley farms fire barn dinner $85 four courses eleven farms oysters duck scallop apple ember" },
    { url: "/menu.html", title: "Menus", kind: "Menu",
      text: "tasting a la carte wine cocktails zero proof gluten free vegetarian dietary filter $85 four movements bread scallop rabbit duck apple chenin gamay riesling cabernet franc trousseau cider rye mezcal old fashioned shrub hay tea" },
    { url: "/story.html", title: "The story", kind: "Page",
      text: "barn 1904 apple Front Street Ada Roerig chef Copenhagen hearth timeline 2019 2021 2023 2024 2026 long table river wall farms Grazin Acres Fishkill Sunspring Meadowlark Chatham oysters press review three stars" },
    { url: "/events.html", title: "Events", kind: "Events",
      text: "long table hearth class winemaker dinner October November game week bread class seats waitlist calendar season trousseau jura" },
    { url: "/journal.html", title: "Journal", kind: "Journal",
      text: "essays field report pass notes kitchen sourcing service menu season hearth window wall monday report" },
    { url: "/journal/reading-a-menu.html", title: "Reading a Menu Is Reading a Place", kind: "Essay",
      text: "menu bread verbs committees escape hatches substitutions allergens adaptation hours of work ninety seconds letter valley map airline schedule octopus" },
    { url: "/journal/the-long-table.html", title: "The Case for the Three-Hour Dinner", kind: "Essay",
      text: "tables turns covers arithmetic tasting two and a half hours pacing staff turnover room condition second course babysitter promise expensive" },
    { url: "/journal/season-as-constraint.html", title: "Season Is Not a Limitation, It Is the Idea", kind: "Essay",
      text: "asparagus ran out tuesday constraint restriction season field report walk-in wholesale flown trust farms candor journal monday" },
    { url: "/journal/the-hearth-notes.html", title: "Notes From the Hearth, Month One", kind: "Essay",
      text: "hearth coals fire zones searing roasting holding smoke ingredient concentration bread scallops cooks line gas capped station discipline" },
    { url: "/journal/the-field-report.html", title: "The Monday Field Report, Explained", kind: "Essay",
      text: "field report monday farms voice notes hail butcher surprise thin ready window walk-in ledger daylight specials pricing trust loyalty" },
    { url: "/journal/what-the-window-wall-does.html", title: "What the Window Wall Does to a Dinner", kind: "Essay",
      text: "window wall glass river hudson candles centerpieces herbs light gold blue service west condenses washing fourth course room participant" },
    { url: "/reserve.html", title: "Reserve", kind: "Page",
      text: "reservation seatings 5:30 8:45 wednesday sunday $85 tasting cancel policy noon accessibility step free restroom private dining long table eight buyout 30 60 guests kids first seating form request table" },
    { url: "/404.html", title: "Off the menu", kind: "Page", text: "404 not found missing page" },
  ];

  const STOP = new Set("the a an and or of to in on at for with from is are was were be been it its as that this these those you your we our".split(" "));

  const tokenize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

  const docs = INDEX.map((entry) => {
    const tokens = new Map();
    for (const t of tokenize(`${entry.title} ${entry.text}`)) {
      tokens.set(t, (tokens.get(t) || 0) + 1);
    }
    return { ...entry, tokens };
  });

  function search(query, limit = 8) {
    const terms = tokenize(query);
    if (!terms.length) return [];
    const scored = [];
    for (const doc of docs) {
      let score = 0;
      let firstHit = "";
      for (const term of terms) {
        const tf = doc.tokens.get(term) || 0;
        if (tf > 0) score += tf * (term.length > 3 ? 2 : 1);
        // partial prefix credit
        for (const key of doc.tokens.keys()) {
          if (key.startsWith(term) && key !== term) score += 0.5;
        }
      }
      // title match bonus
      const titleLower = doc.title.toLowerCase();
      if (terms.some((t) => titleLower.includes(t))) score += 4;
      if (score > 0) {
        for (const term of terms) {
          if (!firstHit) {
            const i = doc.text.toLowerCase().indexOf(term);
            if (i >= 0) firstHit = doc.text.slice(Math.max(0, i - 40), i + 80).trim();
          }
        }
        scored.push({ doc, score, firstHit });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function init() {
    if (document.getElementById("search-sheet")) return;
    const sheet = document.createElement("div");
    sheet.className = "search-sheet";
    sheet.id = "search-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Site search");
    sheet.innerHTML = `
      <div class="search-bar">
        <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="search-input" type="search" placeholder="Search the valley..." aria-label="Search the site" autocomplete="off">
        <span class="search-hint"><kbd>esc</kbd> closes</span>
      </div>
      <div class="search-results" id="search-results" role="listbox" aria-label="Results"></div>`;
    document.body.appendChild(sheet);

    const input = sheet.querySelector("#search-input");
    const results = sheet.querySelector("#search-results");
    let selected = -1;
    let hits = [];

    const open = () => {
      sheet.setAttribute("data-open", "");
      document.body.style.overflow = "hidden";
      input.value = "";
      render("");
      setTimeout(() => input.focus(), 60);
    };

    const close = () => {
      sheet.removeAttribute("data-open");
      document.body.style.overflow = "";
      selected = -1;
    };

    function render(query) {
      hits = search(query);
      selected = -1;
      if (!query.trim()) {
        results.innerHTML = hits
          .map(
            (h) => `<a class="search-hit" href="${h.doc.url}" role="option">
              <span class="hit-kind">${h.doc.kind}</span>
              <span class="hit-title">${escapeHtml(h.doc.title)}</span>
              <span class="hit-snippet">${escapeHtml(h.doc.text.slice(0, 96))}...</span>
            </a>`
          )
          .join("");
        return;
      }
      results.innerHTML = hits.length
        ? hits
            .map((h) => {
              const snippet = h.firstHit || h.doc.text.slice(0, 90);
              const marked = escapeHtml(snippet).replace(
                new RegExp(`(${query.trim().split(/\s+/).map(escapeHtml).join("|")})`, "gi"),
                "<mark>$1</mark>"
              );
              return `<a class="search-hit" href="${h.doc.url}" role="option">
                <span class="hit-kind">${h.doc.kind}</span>
                <span class="hit-title">${escapeHtml(h.doc.title)}</span>
                <span class="hit-snippet">${marked}</span>
              </a>`;
            })
            .join("")
        : '<p class="search-empty">Nothing on the menu by that name.</p>';
    }

    function move(dir) {
      if (!hits.length) return;
      selected = (selected + dir + hits.length) % hits.length;
      results.querySelectorAll(".search-hit").forEach((el, i) => {
        el.toggleAttribute("data-selected", i === selected);
        if (i === selected) el.scrollIntoView({ block: "nearest" });
      });
    }

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      if (e.key === "Enter") {
        const target = selected >= 0 ? results.querySelectorAll(".search-hit")[selected] : results.querySelector(".search-hit");
        if (target) { target.click(); close(); }
      }
      if (e.key === "Escape") close();
    });
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) close();
    });
    results.addEventListener("click", () => close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        open();
      }
    });

    // Inject the trigger into the header tools on every page.
    const tools = document.querySelector(".header-tools");
    if (tools) {
      const btn = document.createElement("button");
      btn.className = "search-trigger";
      btn.type = "button";
      btn.setAttribute("aria-label", "Search the site");
      btn.innerHTML =
        '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      btn.addEventListener("click", open);
      tools.insertBefore(btn, tools.firstChild);
    }
  }

  init();
})();
