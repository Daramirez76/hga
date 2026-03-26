(function (global) {
  const LOGIN_HREF = "login.html";
  const EMPTY_MESSAGE = "No se encontraron notificaciones.";

  const state = {
    notifications: [],
    filteredNotifications: [],
    loading: false,
    error: "",
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
      const empty = createStatusCard(EMPTY_MESSAGE, "empty");
      zone.appendChild(empty);
      if (emptyState instanceof HTMLElement) {
        emptyState.style.display = "none";
      }
      return;
    }

    notifications.forEach((notification) => {
      zone.appendChild(createNotificationCard(notification));
    });

    if (emptyState instanceof HTMLElement) {
      emptyState.style.display = "none";
    }
  }

  async function loadNotifications(options = {}) {
    const service = getService();
    const force = options.force === true;

    if (!ensureAuthenticated()) {
      return;
    }

    state.loading = true;
    state.error = "";
    renderLoading();

    try {
      let notifications = [];

      if (service && typeof service.loadNotifications === "function") {
        notifications = await service.loadNotifications({ force });
      } else {
        const response = await fetch(`${global.location.origin}/api/notificaciones`, {
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

        notifications = await response.json();
        if (!Array.isArray(notifications)) {
          notifications = notifications.data || notifications.notifications || [];
        }
      }

      state.notifications = Array.isArray(notifications) ? notifications : [];
      state.filteredNotifications = state.notifications.slice();
      renderNotifications(state.filteredNotifications);
    } catch (error) {
      state.error = error instanceof Error ? error.message : "No fue posible cargar las notificaciones";
      renderError(state.error);
    } finally {
      state.loading = false;
    }
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
      } else {
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
      }

      notification.isRead = true;
      if (notification.raw && typeof notification.raw === "object") {
        notification.raw.read_at = notification.raw.read_at || new Date().toISOString();
        notification.raw.is_read = true;
        notification.raw.read = true;
      }

      state.notifications = state.notifications.map((item) => {
        if (normalizeId(item) === id) {
          return { ...item, isRead: true };
        }

        return item;
      });

      state.filteredNotifications = filterNotificationsBySearch(state.notifications);
      renderNotifications(state.filteredNotifications);
    } catch (error) {
      console.error("No fue posible marcar la notificacion como leida:", error);
      await loadNotifications({ force: true });
    }
  }

  async function marcarTodasComoLeidas() {
    const service = getService();

    try {
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

      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));

      state.filteredNotifications = filterNotificationsBySearch(state.notifications);
      renderNotifications(state.filteredNotifications);
    } catch (error) {
      console.error("No fue posible marcar todas las notificaciones como leidas:", error);
      await loadNotifications({ force: true });
    }
  }

  function filterNotificationsBySearch(notifications) {
    const searchInput = getSearchInput();
    const query = searchInput instanceof HTMLInputElement ? searchInput.value.trim().toLowerCase() : "";

    if (query === "") {
      return notifications.slice();
    }

    return notifications.filter((notification) => {
      const haystack = [
        notification.title,
        notification.message,
        notification.author,
        formatNotificationDate(notification.createdAt),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  function filtrarNotificaciones() {
    state.filteredNotifications = filterNotificationsBySearch(state.notifications);
    renderNotifications(state.filteredNotifications);
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

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
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
