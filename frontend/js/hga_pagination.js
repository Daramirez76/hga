(function (global) {
  const DEFAULT_PAGE_SIZE = 5;

  function toInteger(value, fallback = 0) {
    const parsed = Number.parseInt(String(value ?? "").trim(), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  function clampPage(page, lastPage) {
    const normalizedLastPage = Math.max(1, toInteger(lastPage, 1));
    const normalizedPage = Math.max(1, toInteger(page, 1));
    return Math.min(normalizedPage, normalizedLastPage);
  }

  function extractCollection(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    if (Array.isArray(payload?.results)) {
      return payload.results;
    }

    return [];
  }

  function buildUrl(endpoint, params = {}) {
    const url = new URL(endpoint, global.location.origin);
    const shouldPaginate = params.paginate !== false;

    if (shouldPaginate) {
      url.searchParams.set("paginate", "true");
    }

    Object.entries(params).forEach(([key, value]) => {
      if (key === "paginate" && value === false) {
        return;
      }

      if (value === undefined || value === null) {
        return;
      }

      const normalized = String(value).trim();
      if (normalized === "") {
        return;
      }

      url.searchParams.set(key, normalized);
    });

    return url.toString();
  }

  function createLocalMeta(total, page, perPage) {
    const normalizedPerPage = Math.max(1, toInteger(perPage, DEFAULT_PAGE_SIZE));
    const normalizedTotal = Math.max(0, toInteger(total, 0));
    const lastPage = Math.max(1, Math.ceil(normalizedTotal / normalizedPerPage));
    const currentPage = clampPage(page, lastPage);
    const from = normalizedTotal === 0 ? 0 : ((currentPage - 1) * normalizedPerPage) + 1;
    const to = normalizedTotal === 0 ? 0 : Math.min(normalizedTotal, currentPage * normalizedPerPage);

    return {
      currentPage,
      perPage: normalizedPerPage,
      total: normalizedTotal,
      lastPage,
      from,
      to,
      serverPaginated: false,
    };
  }

  function normalizeResponse(payload, options = {}) {
    const requestedPage = Math.max(1, toInteger(options.page, 1));
    const requestedPerPage = Math.max(1, toInteger(options.perPage, DEFAULT_PAGE_SIZE));
    const collection = extractCollection(payload);
    const rawMetaWrapper = payload && typeof payload.meta === "object" && payload.meta ? payload.meta : null;
    const rawMeta = rawMetaWrapper && typeof rawMetaWrapper.pagination === "object" && rawMetaWrapper.pagination
      ? rawMetaWrapper.pagination
      : rawMetaWrapper;
    const hasServerMeta = Boolean(
      rawMeta &&
      (
        rawMeta.current_page !== undefined ||
        rawMeta.currentPage !== undefined ||
        rawMeta.last_page !== undefined ||
        rawMeta.lastPage !== undefined ||
        rawMeta.total !== undefined ||
        rawMeta.per_page !== undefined ||
        rawMeta.perPage !== undefined
      )
    );

    if (!hasServerMeta) {
      const localMeta = createLocalMeta(collection.length, requestedPage, requestedPerPage);
      return {
        items: collection,
        meta: localMeta,
      };
    }

    const perPage = Math.max(1, toInteger(rawMeta.per_page ?? rawMeta.perPage, requestedPerPage));
    const total = Math.max(collection.length, toInteger(rawMeta.total ?? rawMeta.count, collection.length));
    const lastPage = Math.max(1, toInteger(rawMeta.last_page ?? rawMeta.lastPage, Math.max(1, Math.ceil(total / perPage))));
    const currentPage = clampPage(rawMeta.current_page ?? rawMeta.currentPage ?? requestedPage, lastPage);
    const from = total === 0 ? 0 : Math.max(1, toInteger(rawMeta.from ?? rawMeta.start, ((currentPage - 1) * perPage) + 1));
    const to = total === 0 ? 0 : Math.max(from, Math.min(total, toInteger(rawMeta.to ?? rawMeta.end, currentPage * perPage)));

    return {
      items: collection,
      meta: {
        currentPage,
        perPage,
        total,
        lastPage,
        from,
        to,
        serverPaginated: true,
      },
    };
  }

  function slicePage(items, page, perPage) {
    const normalizedPage = Math.max(1, toInteger(page, 1));
    const normalizedPerPage = Math.max(1, toInteger(perPage, DEFAULT_PAGE_SIZE));
    const start = (normalizedPage - 1) * normalizedPerPage;
    return Array.isArray(items) ? items.slice(start, start + normalizedPerPage) : [];
  }

  function ensureHost(anchor, id, className = "hga-pagination-host") {
    if (!(anchor instanceof HTMLElement)) {
      return null;
    }

    const existing = id ? document.getElementById(id) : null;
    if (existing instanceof HTMLElement) {
      return existing;
    }

    const host = document.createElement("div");
    host.id = id || "";
    host.className = className;
    anchor.insertAdjacentElement("afterend", host);
    return host;
  }

  function buildPageItems(currentPage, lastPage) {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set([1, lastPage]);
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(lastPage - 1, currentPage + 1);

    for (let page = windowStart; page <= windowEnd; page += 1) {
      pages.add(page);
    }

    return Array.from(pages).sort((left, right) => left - right);
  }

  function renderControls(container, meta, onPageChange, options = {}) {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    container.innerHTML = "";
    const total = Math.max(0, toInteger(meta?.total, 0));
    const lastPage = Math.max(1, toInteger(meta?.lastPage, 1));
    const currentPage = clampPage(meta?.currentPage, lastPage);
    const perPage = Math.max(1, toInteger(meta?.perPage, DEFAULT_PAGE_SIZE));

    if (!options.forceVisible && lastPage <= 1) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    const wrapper = document.createElement("div");
    wrapper.className = "hga-pagination-wrapper mt-3";

    const summary = document.createElement("div");
    summary.className = "d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2";

    const summaryText = document.createElement("div");
    summaryText.className = "small text-muted";
    summaryText.textContent = total > 0
      ? `Mostrando ${meta?.from || 0}-${meta?.to || 0} de ${total} ${options.itemLabel || "resultados"}`
      : `No hay ${options.itemLabel || "resultados"} disponibles`;

    const pageHint = document.createElement("div");
    pageHint.className = "small text-muted";
    pageHint.textContent = `Página ${currentPage} de ${lastPage}`;

    summary.appendChild(summaryText);
    summary.appendChild(pageHint);

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", options.ariaLabel || "Paginación");

    const list = document.createElement("ul");
    list.className = "pagination justify-content-center flex-wrap gap-1 mb-0";

    const createButton = (label, targetPage, disabled = false, active = false, ariaCurrent = "") => {
      const item = document.createElement("li");
      item.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-link";
      button.textContent = label;
      if (active) {
        button.setAttribute("aria-current", ariaCurrent || "page");
      }

      if (disabled || active) {
        button.disabled = true;
      } else {
        button.addEventListener("click", () => {
          if (typeof onPageChange === "function") {
            onPageChange(targetPage);
          }
        });
      }

      item.appendChild(button);
      return item;
    };

    list.appendChild(createButton("Anterior", Math.max(1, currentPage - 1), currentPage <= 1));

    const pageItems = buildPageItems(currentPage, lastPage);
    let previousPage = null;

    pageItems.forEach((page) => {
      if (previousPage !== null && page - previousPage > 1) {
        const ellipsis = document.createElement("li");
        ellipsis.className = "page-item disabled";
        const span = document.createElement("span");
        span.className = "page-link";
        span.textContent = "…";
        ellipsis.appendChild(span);
        list.appendChild(ellipsis);
      }

      list.appendChild(createButton(String(page), page, false, page === currentPage));
      previousPage = page;
    });

    list.appendChild(createButton("Siguiente", Math.min(lastPage, currentPage + 1), currentPage >= lastPage));

    nav.appendChild(list);
    wrapper.appendChild(summary);
    wrapper.appendChild(nav);
    container.appendChild(wrapper);
  }

  global.HgaPagination = {
    DEFAULT_PAGE_SIZE,
    buildUrl,
    clampPage,
    createLocalMeta,
    ensureHost,
    extractCollection,
    normalizeResponse,
    renderControls,
    slicePage,
    toInteger,
  };
})(window);
