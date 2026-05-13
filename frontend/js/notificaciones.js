(function (global) {
  const LOGIN_HREF = "login.html";
  const EMPTY_MESSAGE = "No se encontraron notificaciones.";
  const NOTIFICATIONS_PAGE_SIZE = global.HgaPagination?.DEFAULT_PAGE_SIZE || 5;

  const state = {
    notifications: [],
    loading: false,
    error: "",
    loaded: false,
    searchQuery: "",
    pagination: {
      currentPage: 1,
      perPage: NOTIFICATIONS_PAGE_SIZE,
      total: 0,
      lastPage: 1,
      from: 0,
      to: 0,
      serverPaginated: false,
    },
    paginationHost: null,
    unsubscribe: null,
  };

  function getService() {
    return global.HgaNotificationService || null;
  }

  function getToken() {
    const service = getService();
    if (service && typeof service.getToken === "function") {
      return service.getToken();
    }

    return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
  }

  function redirectToLogin() {
    const service = getService();
    if (service && typeof service.redirectToLogin === "function") {
      service.redirectToLogin();
      return;
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("usuario");
    global.location.href = LOGIN_HREF;
  }

  function ensureAuthenticated() {
    if (!getToken()) {
      redirectToLogin();
      return false;
    }

    return true;
  }

  function getCardsZone() {
    return document.getElementById("cardsZone");
  }

  function getSearchInput() {
    return document.getElementById("inputBuscar");
  }

  function getEmptyState() {
    return document.getElementById("sinResultados");
  }

  function getPaginationHost() {
    if (state.paginationHost instanceof HTMLElement) {
      return state.paginationHost;
    }

    const zone = getCardsZone();
    if (!(zone instanceof HTMLElement)) {
      return null;
    }

    state.paginationHost = global.HgaPagination?.ensureHost
      ? global.HgaPagination.ensureHost(zone, "notificacionesPagination")
      : null;

    return state.paginationHost;
  }

  function compareNotifications(left, right) {
    const leftTime = new Date(left?.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right?.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  }

  function normalizeNotification(raw, index) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const id = raw.id ?? raw.notification_id ?? raw.notificationId ?? raw.uuid ?? raw._id ?? index;
    const message = raw.message ?? raw.descripcion ?? raw.description ?? raw.text ?? raw.content ?? raw.contenido ?? raw.body ?? raw.title ?? "Notificación";
    const title = raw.title ?? raw.titulo ?? raw.subject ?? raw.asunto ?? raw.name ?? String(message).slice(0, 72);
    const author = raw.user_name ?? raw.usuario ?? raw.resident_name ?? raw.residente ?? raw.patient_name ?? raw.patient ?? raw.user?.name ?? raw.user?.full_name ?? raw.user?.nombre ?? "";
    const createdAt = raw.created_at ?? raw.createdAt ?? raw.fecha ?? raw.date ?? raw.timestamp ?? raw.sent_at ?? raw.notified_at ?? raw.updated_at ?? "";
    const isRead = Boolean(
      raw.read_at ||
      raw.leida === true ||
      raw.read === true ||
      raw.is_read === true ||
      raw.seen === true ||
      raw.visto === true ||
      String(raw.estado || "").toLowerCase() === "leida" ||
      String(raw.state || "").toLowerCase() === "read"
    );

    return {
      id,
      title,
      message,
      author,
      createdAt,
      isRead,
      raw,
    };
  }

  function normalizeNotificationList(payload) {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.results)
              ? payload.results
              : [];

    return list
      .map((item, index) => normalizeNotification(item, index))
      .filter(Boolean)
      .sort(compareNotifications);
  }

  function escapeText(value) {
    return String(value ?? "");
  }

  function getNotificationIcon(notification) {
    const service = getService();
    if (service && typeof service.getNotificationIcon === "function") {
      return service.getNotificationIcon(notification);
    }

    return "bi-bell";
  }

  function formatNotificationDate(value) {
    const service = getService();
    if (service && typeof service.formatNotificationDate === "function") {
      return service.formatNotificationDate(value);
    }

    if (!value) {
      return "Sin fecha";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Sin fecha";
    }

    return date.toLocaleString("es-CO");
  }

  function normalizeId(notification) {
    return String(notification?.id ?? notification?.notification_id ?? notification?.uuid ?? "");
  }

  function createStatusCard(message, kind = "info") {
    const card = document.createElement("div");
    card.className = "notif-card";
    card.style.justifyContent = "center";
    card.style.alignItems = "center";
    card.dataset.kind = kind;

    const content = document.createElement("div");
    content.className = "text-center";

    const text = document.createElement("div");
    text.textContent = message;
    content.appendChild(text);

    card.appendChild(content);
    return card;
  }

  function createNotificationCard(notification) {
    const card = document.createElement("div");
    card.className = `notif-card${notification.isRead ? " is-read" : " is-unread"}`;
    card.dataset.notificationId = normalizeId(notification);
    card.dataset.search = [
      notification.title,
      notification.message,
      notification.author,
      formatNotificationDate(notification.createdAt),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const icon = document.createElement("div");
    icon.className = "notif-icon";
    icon.innerHTML = `<i class="bi ${escapeText(getNotificationIcon(notification))}"></i>`;

    const body = document.createElement("div");
    body.className = "notif-body";

    const title = document.createElement("div");
    title.className = "notif-title";
    title.textContent = notification.title || "Notificación";

    const message = document.createElement("div");
    message.className = "notif-message";
    message.textContent = notification.message || notification.title || "";

    const meta = document.createElement("div");
    meta.className = "notif-date";
    const metaParts = [formatNotificationDate(notification.createdAt)];
    if (notification.author) {
      metaParts.push(notification.author);
    }
    meta.textContent = metaParts.filter(Boolean).join(" · ");

    body.appendChild(title);
    body.appendChild(message);
    body.appendChild(meta);

    card.appendChild(icon);
    card.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "notif-actions";

    if (notification.isRead) {
      const badge = document.createElement("span");
      badge.className = "notif-badge-read";
      badge.textContent = "Leída";
      actions.appendChild(badge);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-sm btn-outline-success rounded-pill";
      button.textContent = "Marcar como leída";
      button.addEventListener("click", async () => {
        await marcarComoLeida(notification);
      });
      actions.appendChild(button);
    }

    card.appendChild(actions);
    return card;
  }

  function renderNotifications(notifications) {
    const zone = getCardsZone();
    const emptyState = getEmptyState();

    if (!(zone instanceof HTMLElement)) {
      return;
    }

    zone.innerHTML = "";

    if (notifications.length === 0) {
      const empty = createStatusCard(state.searchQuery ? "No hay notificaciones para esa búsqueda." : EMPTY_MESSAGE, "empty");
      zone.appendChild(empty);
      if (emptyState instanceof HTMLElement) {
        emptyState.style.display = "none";
      }
      renderPaginationControls();
      return;
    }

    notifications.forEach((notification) => {
      zone.appendChild(createNotificationCard(notification));
    });

    if (emptyState instanceof HTMLElement) {
      emptyState.style.display = "none";
    }

    renderPaginationControls();
  }

  function renderPaginationControls() {
    const host = getPaginationHost();

    if (!(host instanceof HTMLElement) || !global.HgaPagination) {
      return;
    }

    global.HgaPagination.renderControls(host, state.pagination, (page) => {
      void loadNotifications({ force: true, page });
    }, {
      itemLabel: "notificaciones",
      ariaLabel: "Paginación de notificaciones",
    });
  }

  function renderLoading() {
    const zone = getCardsZone();
    if (!(zone instanceof HTMLElement)) {
      return;
    }

    zone.innerHTML = "";
    zone.appendChild(createStatusCard("Cargando notificaciones...", "loading"));
  }

  function renderError(message) {
    const zone = getCardsZone();
    if (!(zone instanceof HTMLElement)) {
      return;
    }

    zone.innerHTML = "";

    const card = createStatusCard(message || "No fue posible cargar las notificaciones.", "error");

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-sm btn-outline-success rounded-pill mt-3";
    retry.textContent = "Reintentar";
    retry.addEventListener("click", () => loadNotifications({ force: true }));

    card.appendChild(retry);
    zone.appendChild(card);
    renderPaginationControls();
  }

  function buildNotificationsUrl(page) {
    return global.HgaPagination?.buildUrl
      ? global.HgaPagination.buildUrl(`${global.location.origin}/api/notificaciones`, {
          page,
          per_page: NOTIFICATIONS_PAGE_SIZE,
          search: state.searchQuery,
        })
      : `${global.location.origin}/api/notificaciones?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(NOTIFICATIONS_PAGE_SIZE))}&search=${encodeURIComponent(state.searchQuery)}`;
  }

  async function loadNotifications(options = {}) {
    const service = getService();
    const force = options.force === true;
    const page = Number.isInteger(options.page) && options.page > 0
      ? options.page
      : (state.pagination.currentPage || 1);
    const silent = options.silent === true;

    if (!ensureAuthenticated()) {
      return;
    }

    state.loading = !silent;
    state.error = "";

    if (!silent) {
      renderLoading();
    }

    try {
      const response = await fetch(buildNotificationsUrl(page), {
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error("No fue posible cargar las notificaciones");
      }

      const payload = await response.json();
      const normalized = global.HgaPagination?.normalizeResponse
        ? global.HgaPagination.normalizeResponse(payload, {
            page,
            perPage: NOTIFICATIONS_PAGE_SIZE,
          })
        : {
            items: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
            meta: {
              currentPage: page,
              perPage: NOTIFICATIONS_PAGE_SIZE,
              total: Array.isArray(payload?.data) ? payload.data.length : Array.isArray(payload) ? payload.length : 0,
              lastPage: 1,
              from: 0,
              to: 0,
              serverPaginated: false,
            },
          };

      const normalizedItems = service && typeof service.normalizeNotificationList === "function"
        ? service.normalizeNotificationList(payload)
        : normalizeNotificationList(payload);

      state.pagination = normalized.meta;
      state.notifications = normalized.meta.serverPaginated
        ? normalizedItems.slice()
        : (global.HgaPagination?.slicePage
          ? global.HgaPagination.slicePage(normalizedItems, normalized.meta.currentPage, normalized.meta.perPage)
          : normalizedItems.slice((normalized.meta.currentPage - 1) * normalized.meta.perPage, normalized.meta.currentPage * normalized.meta.perPage));
      state.loaded = true;
      state.error = "";
      renderNotifications(state.notifications);
    } catch (error) {
      state.error = error instanceof Error ? error.message : "No fue posible cargar las notificaciones";
      renderError(state.error);
    } finally {
      state.loading = false;
    }
  }

  async function marcarComoLeida(notification) {
    const service = getService();
    const id = normalizeId(notification);

    if (!id) {
      return;
    }

    try {
      if (service && typeof service.markNotificationAsRead === "function") {
        await service.markNotificationAsRead(id);
        await loadNotifications({ force: true, page: state.pagination.currentPage, silent: true });
        return;
      }

      const response = await fetch(`${global.location.origin}/api/notificaciones/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error("No fue posible marcar la notificacion como leida");
      }

      await loadNotifications({ force: true, page: state.pagination.currentPage, silent: true });
    } catch (error) {
      console.error("No fue posible marcar la notificacion como leida:", error);
      await loadNotifications({ force: true });
    }
  }

  async function marcarTodasComoLeidas() {
    const service = getService();

    try {
      if (service && typeof service.markAllNotificationsAsRead === "function") {
        await service.markAllNotificationsAsRead();
        await loadNotifications({ force: true, page: state.pagination.currentPage, silent: true });
        return;
      }

      if (service && typeof service.requestJson === "function") {
        await service.requestJson(`${global.location.origin}/api/notificaciones/read-all`, {
          method: "PATCH",
        });
      } else {
        const response = await fetch(`${global.location.origin}/api/notificaciones/read-all`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error("No fue posible marcar las notificaciones como leidas");
        }
      }

      await loadNotifications({ force: true, page: state.pagination.currentPage, silent: true });
    } catch (error) {
      console.error("No fue posible marcar todas las notificaciones como leidas:", error);
      await loadNotifications({ force: true });
    }
  }

  function filtrarNotificaciones() {
    const searchInput = getSearchInput();
    state.searchQuery = searchInput instanceof HTMLInputElement ? searchInput.value.trim() : "";
    void loadNotifications({ force: true, page: 1 });
  }

  function bindEvents() {
    const searchInput = getSearchInput();
    const refreshButton = document.getElementById("btnActualizarNotificaciones");
    const markAllButton = document.getElementById("btnMarcarTodasLeidas");
    const emptyState = getEmptyState();

    if (searchInput instanceof HTMLInputElement) {
      searchInput.addEventListener("input", filtrarNotificaciones);
    }

    if (refreshButton instanceof HTMLElement) {
      refreshButton.addEventListener("click", () => loadNotifications({ force: true }));
    }

    if (markAllButton instanceof HTMLElement) {
      markAllButton.addEventListener("click", marcarTodasComoLeidas);
    }

    if (emptyState instanceof HTMLElement) {
      emptyState.style.display = "none";
    }
  }

  function subscribeToReactiveStore() {
    const service = getService();

    if (!service || typeof service.subscribe !== "function") {
      return;
    }

    if (typeof state.unsubscribe === "function") {
      state.unsubscribe();
    }

    state.unsubscribe = service.subscribe((snapshot) => {
      if (snapshot && !snapshot.loading && state.loaded) {
        void loadNotifications({ force: true, page: state.pagination.currentPage, silent: true });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    subscribeToReactiveStore();
    loadNotifications();
  });

  global.abrirOverlay = function abrirOverlay() {
    loadNotifications({ force: true });
  };

  global.cerrarOverlay = function cerrarOverlay() {
    filtrarNotificaciones();
  };

  global.cerrarOverlaySiFondo = function cerrarOverlaySiFondo() {
    return false;
  };

  global.confirmarNotificacion = function confirmarNotificacion() {
    loadNotifications({ force: true });
  };

  global.filtrarNotificaciones = filtrarNotificaciones;
  global.cargarNotificaciones = loadNotifications;
  global.marcarTodasComoLeidas = marcarTodasComoLeidas;
})(window);
