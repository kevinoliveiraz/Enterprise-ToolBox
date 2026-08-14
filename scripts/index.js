/**
 * INDEX.JS
 * Lógica da página inicial: monta os grids a partir de tools-data.js,
 * controla sidebar retrátil, busca e command palette (Ctrl+K).
 *
 * Roteamento das ferramentas: cada card/linha aponta para
 * <slug>.html na raiz do projeto — arquivo que ainda não existe é tratado
 * com um aviso amigável em vez de dar 404 silencioso.
 */

(function () {
  "use strict";

  const TOOL_ROUTE = (slug) => `${slug}.html`;

  /* -------------------- ÍCONES (SVG inline por chave) -------------------- */

  const ICONS = {
    code: `<path d="M8 8L3 12.5L8 17M16 8L21 12.5L16 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    sheet: `<rect x="3.5" y="4" width="17" height="16" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5H20.5M3.5 15H20.5M9.5 4V20" stroke="currentColor" stroke-width="1.8"/>`,
    doc: `<path d="M7 3H14L19 8V21H7V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3V8H19" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
    qrcode: `<rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/><path d="M14 14H16.5V16.5H14V14ZM14 18H16.5V20.5H14V18ZM18 14H20.5V16.5H18V14ZM18 18H20.5V20.5H18V18Z" fill="currentColor"/>`,
    braces: `<path d="M8 4C6 4 5.5 5 5.5 6.5V9.5C5.5 11 4 11.5 4 12C4 12.5 5.5 13 5.5 14.5V17.5C5.5 19 6 20 8 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 4C18 4 18.5 5 18.5 6.5V9.5C18.5 11 20 11.5 20 12C20 12.5 18.5 13 18.5 14.5V17.5C18.5 19 18 20 16 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    image: `<rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.7" stroke="currentColor" stroke-width="1.6"/><path d="M4 17L9 12.5L12.5 15.5L16 11.5L20.5 16" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
    swap: `<path d="M4 8H17L14 5M20 16H7L10 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    server: `<rect x="3.5" y="4" width="17" height="6" rx="1.2" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="14" width="17" height="6" rx="1.2" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="7" r="0.8" fill="currentColor"/><circle cx="7" cy="17" r="0.8" fill="currentColor"/>`,
    shield: `<path d="M12 3L20 6.5V11.5C20 16.2 16.9 20.3 12 21.5C7.1 20.3 4 16.2 4 11.5V6.5L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
    check: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12.5L11 15L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    chart: `<path d="M4 18L9.5 12L13.5 15.5L20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 8H20V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    wrench: `<path d="M14.7 6.3L17.7 9.3M4 20L10.5 13.5M13 5L19 11L20.5 9.5C21.3 8.4 21.2 6.9 20.2 5.9C19.2 4.9 17.7 4.8 16.6 5.6L13 5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
    star: `<path d="M12 3L14.7 9.2L21.5 9.9L16.4 14.5L17.9 21.2L12 17.7L6.1 21.2L7.6 14.5L2.5 9.9L9.3 9.2L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  };

  const ICON_COLOR_CLASS = {
    code: "ic-violet",
    braces: "ic-violet",
    sheet: "ic-green",
    doc: "ic-orange",
    qrcode: "ic-fuchsia",
    image: "ic-rose",
    swap: "ic-blue",
    server: "ic-blue",
    shield: "ic-green",
    check: "ic-green",
    chart: "ic-orange",
    wrench: "ic-violet",
    star: "ic-fuchsia",
  };

  function iconSvg(key) {
    return `<svg viewBox="0 0 24 24" fill="none">${ICONS[key] || ICONS.wrench}</svg>`;
  }

  /* -------------------- FAVORITOS (localStorage) -------------------- */

  const FAV_KEY = "etb_favorites";
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function toggleFavorite(slug) {
    const favs = getFavorites();
    const idx = favs.indexOf(slug);
    if (idx > -1) favs.splice(idx, 1);
    else favs.push(slug);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs;
  }

  /* -------------------- NAVEGAÇÃO PARA FERRAMENTA -------------------- */

  function openTool(slug) {
    const tool = TOOLS.find((t) => t.slug === slug);
    if (!tool) return;
    // Sempre navega para o arquivo dedicado da ferramenta, na raiz do projeto.
    // Enquanto o arquivo ainda não existir, o próprio <slug>.html
    // (quando criado) deve existir fisicamente ao lado do index.html;
    // aqui apenas fazemos o roteamento — não há checagem de 404 client-side
    // possível sem servidor, então confiamos na existência do arquivo.
    window.location.href = TOOL_ROUTE(slug);
  }

  /* -------------------- RENDER: ACESSO RÁPIDO -------------------- */

  function renderQuickGrid() {
    const grid = document.getElementById("quickGrid");
    const favs = getFavorites();
    const quickTools = TOOLS.filter((t) => t.quickAccess);

    grid.innerHTML = quickTools
      .map((tool) => {
        const isFav = favs.includes(tool.slug);
        const badgeOrFav = tool.ready
          ? `<button class="tool-card-fav ${isFav ? "is-fav" : ""}" data-fav="${tool.slug}" aria-label="Favoritar ${tool.name}" title="Favoritar">
              <svg viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}"><path d="M12 3L14.7 9.2L21.5 9.9L16.4 14.5L17.9 21.2L12 17.7L6.1 21.2L7.6 14.5L2.5 9.9L9.3 9.2L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>`
          : `<span class="tool-card-badge">Em breve</span>`;
        return `
        <a class="tool-card" href="${TOOL_ROUTE(tool.slug)}" data-slug="${tool.slug}">
          ${badgeOrFav}
          <div class="tool-card-icon ${ICON_COLOR_CLASS[tool.icon] || "ic-violet"}">${iconSvg(tool.icon)}</div>
          <div class="tool-card-body">
            <p class="tool-card-name">${tool.name}</p>
            <p class="tool-card-desc">${tool.desc}</p>
          </div>
        </a>`;
      })
      .join("");

    // impedir que clique na estrela navegue junto
    grid.querySelectorAll("[data-fav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(btn.dataset.fav);
        renderQuickGrid();
      });
    });
  }

  /* -------------------- RENDER: CATEGORIAS -------------------- */

  function renderCatGrid() {
    const grid = document.getElementById("catGrid");
    grid.innerHTML = CATEGORIES.map((cat) => {
      const count = CATEGORY_DISPLAY_COUNT[cat.id] ?? TOOLS.filter((t) => t.category === cat.id).length;
      return `
      <a class="cat-card" href="#" data-category="${cat.id}" id="cat-${cat.id}">
        <div class="cat-card-icon ${ICON_COLOR_CLASS[cat.icon] || "ic-violet"}">${iconSvg(cat.icon)}</div>
        <div>
          <p class="cat-card-name">${cat.label}</p>
          <p class="cat-card-count">${count} ferramentas</p>
        </div>
      </a>`;
    }).join("");

    grid.querySelectorAll(".cat-card").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        filterTools(el.dataset.category);
        document.getElementById("allToolsSection").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* -------------------- RENDER: TODAS AS FERRAMENTAS -------------------- */

  let currentFilter = "todos";

  function renderFilterTabs() {
    const tabs = document.getElementById("filterTabs");
    const allTabs = [{ id: "todos", label: "Todos" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];
    tabs.innerHTML = allTabs
      .map((t) => `<button class="filter-tab ${t.id === currentFilter ? "active" : ""}" data-filter="${t.id}">${t.label}</button>`)
      .join("");

    tabs.querySelectorAll(".filter-tab").forEach((btn) => {
      btn.addEventListener("click", () => filterTools(btn.dataset.filter));
    });
  }

  function renderToolsGrid() {
    const grid = document.getElementById("toolsGrid");
    const favs = getFavorites();
    const list = currentFilter === "todos" ? TOOLS : TOOLS.filter((t) => t.category === currentFilter);

    if (list.length === 0) {
      grid.innerHTML = `<p style="color:var(--ink-faint); font-size:13.5px; grid-column: 1 / -1;">Nenhuma ferramenta nesta categoria ainda.</p>`;
      return;
    }

    grid.innerHTML = list
      .map((tool) => {
        const isFav = favs.includes(tool.slug);
        const badgeOrFav = tool.ready
          ? `<button class="tool-card-fav ${isFav ? "is-fav" : ""}" data-fav="${tool.slug}" aria-label="Favoritar ${tool.name}" title="Favoritar">
              <svg viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}"><path d="M12 3L14.7 9.2L21.5 9.9L16.4 14.5L17.9 21.2L12 17.7L6.1 21.2L7.6 14.5L2.5 9.9L9.3 9.2L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>`
          : `<span class="tool-card-badge">Em breve</span>`;
        return `
        <a class="tool-card" href="${TOOL_ROUTE(tool.slug)}" data-slug="${tool.slug}">
          ${badgeOrFav}
          <div class="tool-card-icon ${ICON_COLOR_CLASS[tool.icon] || "ic-violet"}">${iconSvg(tool.icon)}</div>
          <div class="tool-card-body">
            <p class="tool-card-name">${tool.name}</p>
            <p class="tool-card-desc">${tool.desc}</p>
          </div>
        </a>`;
      })
      .join("");

    grid.querySelectorAll("[data-fav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(btn.dataset.fav);
        renderToolsGrid();
        renderQuickGrid();
      });
    });
  }

  function filterTools(categoryId) {
    currentFilter = categoryId;
    renderFilterTabs();
    renderToolsGrid();
  }

  /* -------------------- SIDEBAR TOGGLE -------------------- */

  function initSidebar() {
    const app = document.querySelector(".app");
    const toggle = document.getElementById("sidebarToggle");
    const mobileBtn = document.getElementById("mobileMenuBtn");
    const backdrop = document.getElementById("sidebarBackdrop");

    const STATE_KEY = "etb_sidebar_state";
    const saved = localStorage.getItem(STATE_KEY);
    if (saved === "closed") app.setAttribute("data-sidebar", "closed");

    // Em telas largas, o toggle recolhe/expande a sidebar (estado salvo).
    // Em mobile, o botão do topbar simplesmente abre/fecha o menu por cima do conteúdo.
    toggle.addEventListener("click", () => {
      const isOpen = app.getAttribute("data-sidebar") === "open";
      app.setAttribute("data-sidebar", isOpen ? "closed" : "open");
      localStorage.setItem(STATE_KEY, isOpen ? "closed" : "open");
    });

    mobileBtn.addEventListener("click", () => {
      const isOpen = app.getAttribute("data-sidebar") === "open";
      app.setAttribute("data-sidebar", isOpen ? "closed" : "open");
    });

    // Clicar fora da sidebar (no fundo escurecido) fecha o menu no mobile.
    backdrop.addEventListener("click", () => {
      app.setAttribute("data-sidebar", "closed");
      localStorage.setItem(STATE_KEY, "closed");
    });

    // Fecha o menu mobile automaticamente ao navegar por um item da sidebar.
    document.querySelectorAll(".sidebar-nav .nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (window.innerWidth <= 900) {
          app.setAttribute("data-sidebar", "closed");
        }
      });
    });
  }

  /* -------------------- BUSCA (topbar + hero) -------------------- */

  function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return;

    // match exato ou parcial no nome
    const match = TOOLS.find(
      (t) => t.name.toLowerCase().includes(q) || t.slug.includes(q.replace(/\s+/g, "-"))
    );

    if (match) {
      openTool(match.slug);
    } else {
      // sem resultado: joga na seção "todas as ferramentas" filtrando visualmente
      currentFilter = "todos";
      renderFilterTabs();
      const grid = document.getElementById("toolsGrid");
      const results = TOOLS.filter(
        (t) => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );
      const favs = getFavorites();
      if (results.length) {
        grid.innerHTML = results
          .map((tool) => {
            const isFav = favs.includes(tool.slug);
            const badgeOrFav = tool.ready
              ? `<button class="tool-card-fav ${isFav ? "is-fav" : ""}" data-fav="${tool.slug}"><svg viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}"><path d="M12 3L14.7 9.2L21.5 9.9L16.4 14.5L17.9 21.2L12 17.7L6.1 21.2L7.6 14.5L2.5 9.9L9.3 9.2L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>`
              : `<span class="tool-card-badge">Em breve</span>`;
            return `
            <a class="tool-card" href="${TOOL_ROUTE(tool.slug)}" data-slug="${tool.slug}">
              ${badgeOrFav}
              <div class="tool-card-icon ${ICON_COLOR_CLASS[tool.icon] || "ic-violet"}">${iconSvg(tool.icon)}</div>
              <div class="tool-card-body">
                <p class="tool-card-name">${tool.name}</p>
                <p class="tool-card-desc">${tool.desc}</p>
              </div>
            </a>`;
          })
          .join("");
      } else {
        grid.innerHTML = `<p style="color:var(--ink-faint); font-size:13.5px; grid-column: 1 / -1;">Nenhuma ferramenta encontrada para "<strong>${query}</strong>".</p>`;
      }
      document.getElementById("allToolsSection").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initSearchBars() {
    const heroForm = document.getElementById("heroSearchForm");
    const heroInput = document.getElementById("heroSearchInput");
    heroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      performSearch(heroInput.value);
    });

    const globalSearch = document.getElementById("globalSearch");
    globalSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performSearch(globalSearch.value);
    });
    globalSearch.addEventListener("click", () => openCmdk());

    document.querySelectorAll(".chip[data-tool]").forEach((chip) => {
      chip.addEventListener("click", () => openTool(chip.dataset.tool));
    });
  }

  /* -------------------- COMMAND PALETTE (Ctrl+K) -------------------- */

  let cmdkActiveIndex = -1;
  let cmdkList = [];

  function openCmdk() {
    const overlay = document.getElementById("cmdkOverlay");
    const input = document.getElementById("cmdkInput");
    overlay.classList.add("open");
    renderCmdkResults("");
    setTimeout(() => input.focus(), 30);
  }

  function closeCmdk() {
    document.getElementById("cmdkOverlay").classList.remove("open");
    document.getElementById("cmdkInput").value = "";
    cmdkActiveIndex = -1;
  }

  function renderCmdkResults(query) {
    const q = query.trim().toLowerCase();
    const results = document.getElementById("cmdkResults");
    cmdkList = q
      ? TOOLS.filter((t) => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
      : TOOLS;

    if (cmdkList.length === 0) {
      results.innerHTML = `<div class="cmdk-empty">Nenhuma ferramenta encontrada.</div>`;
      return;
    }

    results.innerHTML = cmdkList
      .map((tool, i) => {
        const catLabel = CATEGORIES.find((c) => c.id === tool.category)?.label || "";
        return `
        <a class="cmdk-item ${i === cmdkActiveIndex ? "active" : ""}" href="${TOOL_ROUTE(tool.slug)}" data-idx="${i}">
          <div class="cmdk-item-icon ${ICON_COLOR_CLASS[tool.icon] || "ic-violet"}">${iconSvg(tool.icon)}</div>
          <span class="cmdk-item-name">${tool.name}</span>
          <span class="cmdk-item-cat">${catLabel}</span>
        </a>`;
      })
      .join("");
  }

  function initCmdk() {
    const overlay = document.getElementById("cmdkOverlay");
    const input = document.getElementById("cmdkInput");

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCmdk();
      }
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        closeCmdk();
      }
      if (overlay.classList.contains("open")) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          cmdkActiveIndex = Math.min(cmdkActiveIndex + 1, cmdkList.length - 1);
          renderCmdkResults(input.value);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          cmdkActiveIndex = Math.max(cmdkActiveIndex - 1, 0);
          renderCmdkResults(input.value);
        }
        if (e.key === "Enter" && cmdkActiveIndex > -1 && cmdkList[cmdkActiveIndex]) {
          e.preventDefault();
          openTool(cmdkList[cmdkActiveIndex].slug);
        }
      }
    });

    input.addEventListener("input", () => {
      cmdkActiveIndex = -1;
      renderCmdkResults(input.value);
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeCmdk();
    });
  }

  /* -------------------- THEME TOGGLE (placeholder simples) -------------------- */

  function initTheme() {
    const btn = document.getElementById("themeToggle");
    btn.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark-preview");
      // Tema escuro completo pode ser implementado depois; por ora,
      // o botão está pronto e funcional para receber essa lógica.
    });
  }

  /* -------------------- INIT -------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    renderQuickGrid();
    renderCatGrid();
    renderFilterTabs();
    renderToolsGrid();
    initSidebar();
    initSearchBars();
    initCmdk();
    initTheme();
  });
})();
