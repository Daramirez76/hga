(function (global) {
  const API_BASE = global.location.origin;
  const NOTIFICATIONS_ENDPOINT = `${API_BASE}/api/notificaciones`;
  const VIEW_ALL_LABEL = "Ver todas las notificaciones";
  const VIEW_ALL_HREF = "notificaciones.html";
  const DEFAULT_LIMIT = 5;

  const state = {
    items: [],
    loading: false,
    loaded: false,
    error: "",
    promise: null,
  };

  function ensureStyles() {
    if (document.getElementById("hga-notification-menu-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "hga-notification-menu-styles";
    style.textContent = `
      .notification-menu-wrapper {
        position: relative;
      }

      .notification-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        min-width: 320px;
        max-width: min(420px, calc(100vw - 24px));
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(200, 230, 201, 0.8);
        border-radius: 16px;
        box-shadow: 0 12px 24px rgba(46, 125, 50, 0.15);
        overflow: hidden;
        opacity: 0;
        transform: translateY(-8px);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 30;
      }

      .notification-dropdown.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .notification-dropdown-list {
        max-height: 360px;
        overflow: auto;
      }

      .notification-menu-item {
        width: 100%;
        display: block;
        border: 0;
        background: transparent;
        color: #2e7d32;
        text-align: left;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s ease, color 0.2s ease;
      }

      .notification-menu-item:hover,
      .notification-menu-item:focus-visible {
        background: linear-gradient(135deg, #e8f5e9, #d9f0ee);
        color: #1b5e20;
        outline: none;
      }

      .notification-menu-item + .notification-menu-item {
        border-top: 1px solid rgba(200, 230, 201, 0.7);
      }

      .notification-menu-item.view-all {
        text-align: center;
        background: #f8f9fa;
        font-weight: 700;
      }

      .notification-dropdown-footer {
        border-top: 1px solid rgba(200, 230, 201, 0.7);
      }

      .notification-menu-item.notification-entry {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .notification-menu-item.notification-entry.is-read {
        color: #5a6b5b;
      }

      .notification-menu-item.notification-entry.is-read:hover,
      .notification-menu-item.notification-entry.is-read:focus-visible {
        color: #2e7d32;
      }

      .notification-menu-item.notification-entry .notification-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #3aaa7a;
        margin-top: 6px;
        flex: 0 0 auto;
      }

      .notification-menu-item.notification-entry.is-read .notification-dot {
        background: transparent;
        border: 1px solid #c7d8c8;
      }

      .notification-menu-item.notification-entry .notification-copy {
        flex: 1;
        min-width: 0;
      }

      .notification-menu-item.notification-entry .notification-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 2px;
        word-break: break-word;
      }

      .notification-menu-item.notification-entry .notification-meta {
        font-size: 12px;
        color: #6b7f6d;
      }

      .notification-menu-item.notification-entry .notification-preview {
        font-size: 12px;
        color: #4f6352;
        opacity: 0.95;
        margin-top: 2px;
        word-break: break-word;
      }

      .notification-menu-state {
        padding: 14px 16px;
        color: #4f6352;
        font-size: 13px;
      }

      .notification-menu-state.is-error {
        color: #b42318;
        background: #fff5f5;
      }

      .notification-menu-state.is-empty {
        color: #6b7f6d;
      }
    `;

    document.head.appendChild(style);
  }

  function getToken() {
    return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
  }

  function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("usuario");
  }

  function redirectToLogin() {
    clearSession();
    global.location.href = document.body?.dataset?.loginPage?.trim() || "login.html";
  }

  function ensureToken() {
    const token = getToken();
    if (!token) {
      redirectToLogin();
      throw new Error("No hay una sesion activa");
    }
    return token;
  }

  async function requestJson(url, options = {}) {
    const token = ensureToken();
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined && options.body !== null ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    if (response.status === 401) {
      redirectToLogin();
      throw new Error("Sesion expirada");
    }

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const payload = hasJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = hasJson && payload && typeof payload === "object"
        ? payload.message || payload.error || "No fue posible completar la solicitud"
        : "No fue posible completar la solicitud";
      throw new Error(message);
    }

    return payload;
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

  function normalizeNotification(raw, index) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const id =
      raw.id ??
      raw.notification_id ??
      raw.notificationId ??
      raw.uuid ??
      raw._id ??
      raw.key ??
      index;

    const message =
      raw.message ??
      raw.descripcion ??
      raw.description ??
      raw.text ??
      raw.content ??
      raw.contenido ??
      raw.body ??
      raw.title ??
      "Notificación";

    const title =
      raw.title ??
      raw.titulo ??
      raw.subject ??
      raw.asunto ??
      raw.name ??
      truncateText(message, 72);

    const author =
      raw.user_name ??
      raw.usuario ??
      raw.resident_name ??
      raw.residente ??
      raw.patient_name ??
      raw.patient ??
      raw.user?.name ??
      raw.user?.full_name ??
      raw.user?.nombre ??
      "";

    const createdAt =
      raw.created_at ??
      raw.createdAt ??
      raw.fecha ??
      raw.date ??
      raw.timestamp ??
      raw.sent_at ??
      raw.notified_at ??
      raw.updated_at ??
      "";

    const isRead = Boolean(
      raw.read_at ||
      raw.leida === true ||
      raw.read === true ||
      raw.is_read === true ||
      raw.seen === true ||
      raw.visto === true ||
      String(raw.estado || "").toLowerCase() === "leida" ||
      String(raw.state || "").toLowerCase() === "read",
    );

    const type = String(raw.type || raw.icon || raw.categoria || raw.category || raw.module || "").toLowerCase();

    return {
      id,
      title,
      message,
      author,
      createdAt,
      isRead,
      type,
      raw,
    };
  }

  function compareNotifications(a, b) {
    const dateDelta = toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    if (dateDelta !== 0) {
      return dateDelta;
    }

    const idA = typeof a.id === "number" ? a.id : String(a.id || "");
    const idB = typeof b.id === "number" ? b.id : String(b.id || "");
    return String(idB).localeCompare(String(idA));
  }

  function toTimestamp(value) {
    const timestamp = new Date(value || "").getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function truncateText(text, maxLength) {
    const safeText = String(text || "").trim();
    if (safeText.length <= maxLength) {
      return safeText;
    }

    return `${safeText.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
  }

  function formatNotificationDate(value) {
    const timestamp = toTimestamp(value);
    if (!timestamp) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }

  function getNotificationIcon(notification) {
    const type = notification?.type || "";

    if (type.includes("medic") || type.includes("pill") || type.includes("farm")) {
      return "bi-capsule";
    }

    if (type.includes("visit") || type.includes("visita")) {
      return "bi-people";
    }

    if (type.includes("cita") || type.includes("appointment") || type.includes("calendar")) {
      return "bi-calendar2-heart";
    }

    if (type.includes("inform") || type.includes("report")) {
      return "bi-file-earmark-text";
    }

    if (type.includes("activ") || type.includes("ludic") || type.includes("activity")) {
      return "bi-palette";
    }

    if (type.includes("alert") || type.includes("warning")) {
      return "bi-exclamation-triangle";
    }

    return "bi-bell";
  }

  function getShortPreview(notification) {
    const base = notification.message || notification.title || "";
    return truncateText(base, 120);
  }

  async function loadNotifications(options = {}) {
    const force = options.force === true;

    if (state.loaded && !force) {
      return state.items;
    }

    if (state.promise && !force) {
      return state.promise;
    }

    state.loading = true;
    state.error = "";
    state.promise = requestJson(NOTIFICATIONS_ENDPOINT, { method: "GET" })
      .then((payload) => {
        state.items = normalizeNotificationList(payload);
        state.loaded = true;
        return state.items;
      })
      .catch((error) => {
        state.error = error instanceof Error ? error.message : "No fue posible cargar notificaciones";
        throw error;
      })
      .finally(() => {
        state.loading = false;
        state.promise = null;
      });

    return state.promise;
  }

  async function markNotificationAsRead(id) {
    if (id === undefined || id === null || id === "") {
      return false;
    }

    await requestJson(`${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(String(id))}/read`, {
      method: "PATCH",
    });

    const notification = state.items.find((item) => String(item.id) === String(id));
    if (notification) {
      notification.isRead = true;
      notification.raw = {
        ...(notification.raw || {}),
        read_at: notification.raw?.read_at || new Date().toISOString(),
        is_read: true,
        read: true,
      };
    }

    return true;
  }

  function renderDropdownState(dropdown, kind, message) {
    const list = getDropdownList(dropdown);
    if (!(list instanceof HTMLElement)) {
      return;
    }

    list.innerHTML = "";
    const stateBox = document.createElement("div");
    stateBox.className = `notification-menu-state ${kind}`;
    stateBox.textContent = message;
    list.appendChild(stateBox);
  }

  function createMenuItem(notification) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `notification-menu-item notification-entry${notification.isRead ? " is-read" : ""}`;
    button.setAttribute("aria-label", notification.isRead ? "Notificación leída" : "Notificación sin leer");

    const dot = document.createElement("span");
    dot.className = "notification-dot";

    const copy = document.createElement("span");
    copy.className = "notification-copy";

    const title = document.createElement("div");
    title.className = "notification-title";
    title.textContent = notification.title || "Notificación";

    const preview = document.createElement("div");
    preview.className = "notification-preview";
    preview.textContent = getShortPreview(notification);

    const meta = document.createElement("div");
    meta.className = "notification-meta";
    const parts = [formatNotificationDate(notification.createdAt)];
    if (notification.author) {
      parts.push(notification.author);
    }
    meta.textContent = parts.filter(Boolean).join(" · ");

    copy.appendChild(title);
    copy.appendChild(preview);
    copy.appendChild(meta);

    button.appendChild(dot);
    button.appendChild(copy);

    if (!notification.isRead) {
      button.addEventListener("click", async () => {
        try {
          await markNotificationAsRead(notification.id);
          renderDropdown(button.closest(".notification-dropdown"));
        } catch (error) {
          console.error("No fue posible marcar la notificacion como leida:", error);
        }
      });
    } else {
      button.addEventListener("click", () => {
        const dropdown = button.closest(".notification-dropdown");
        if (dropdown) {
          closeDropdown(dropdown);
        }
      });
    }

    return button;
  }

  function createViewAllItem() {
    const link = document.createElement("a");
    link.className = "notification-menu-item view-all";
    link.href = VIEW_ALL_HREF;
    link.textContent = VIEW_ALL_LABEL;
    return link;
  }

  function createDropdown() {
    const dropdown = document.createElement("div");
    dropdown.className = "notification-dropdown";
    dropdown.setAttribute("role", "menu");

    const list = document.createElement("div");
    list.className = "notification-dropdown-list";
    list.dataset.notificationMenuList = "true";
    dropdown.appendChild(list);

    const footer = document.createElement("div");
    footer.className = "notification-dropdown-footer";
    footer.appendChild(createViewAllItem());
    dropdown.appendChild(footer);
    return dropdown;
  }

  function getDropdownList(dropdown) {
    return dropdown.querySelector('[data-notification-menu-list="true"]');
  }

  function renderDropdown(dropdown) {
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }

    const list = getDropdownList(dropdown);
    if (!(list instanceof HTMLElement)) {
      return;
    }

    list.innerHTML = "";

    if (state.loading) {
      renderDropdownState(dropdown, "", "Cargando notificaciones...");
      return;
    }

    if (state.error) {
      renderDropdownState(dropdown, "is-error", state.error);
      return;
    }

    const items = state.items.slice(0, DEFAULT_LIMIT);
    if (items.length === 0) {
      renderDropdownState(dropdown, "is-empty", "No tienes notificaciones pendientes.");
      return;
    }

    items.forEach((notification) => {
      list.appendChild(createMenuItem(notification));
    });
  }

  function wrapButton(button) {
    const wrapper = document.createElement("div");
    wrapper.className = "notification-menu-wrapper";

    const parent = button.parentNode;
    parent.insertBefore(wrapper, button);
    wrapper.appendChild(button);

    return wrapper;
  }

  function closeDropdown(dropdown, button) {
    if (dropdown instanceof HTMLElement) {
      dropdown.classList.remove("show");
    }

    if (button instanceof HTMLElement) {
      button.setAttribute("aria-expanded", "false");
    }
  }

  function closeProfileDropdownIfOpen() {
    if (global.HgaUserMenu && typeof global.HgaUserMenu.closeAll === "function") {
      global.HgaUserMenu.closeAll();
      return;
    }

    const profileDropdown = document.getElementById("profileDropdown");
    const profileButton = document.getElementById("profileMenuButton");

    if (profileDropdown) {
      profileDropdown.classList.remove("show");
    }

    if (profileButton) {
      profileButton.setAttribute("aria-expanded", "false");
    }
  }

  async function ensureDropdownContent(dropdown) {
    renderDropdown(dropdown);

    if (state.loaded) {
      return;
    }

    try {
      await loadNotifications();
      renderDropdown(dropdown);
    } catch (error) {
      console.error("No fue posible cargar notificaciones:", error);
      renderDropdown(dropdown);
    }
  }

  function setupButton(button) {
    if (!(button instanceof HTMLElement) || button.dataset.notificationMenuReady === "true") {
      return;
    }

    ensureStyles();

    button.dataset.notificationMenuReady = "true";
    button.removeAttribute("onclick");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");

    const wrapper = button.parentElement && button.parentElement.classList.contains("notification-menu-wrapper")
      ? button.parentElement
      : wrapButton(button);

    const existingDropdown = wrapper.querySelector(".notification-dropdown");
    const dropdown = existingDropdown || createDropdown();

    if (!existingDropdown) {
      wrapper.appendChild(dropdown);
    }

    const closeMenu = () => closeDropdown(dropdown, button);

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      closeProfileDropdownIfOpen();

      const isOpen = dropdown.classList.toggle("show");
      button.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        await ensureDropdownContent(dropdown);
      } else {
        closeMenu();
      }
    });

    dropdown.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.target;

      if (target instanceof HTMLAnchorElement) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    const profileButton = document.getElementById("profileMenuButton");
    if (profileButton) {
      profileButton.addEventListener("click", () => {
        closeMenu();
      });
    }
  }

  function init() {
    const buttons = document.querySelectorAll('[aria-label="Notificaciones"]');

    buttons.forEach((button) => {
      setupButton(button);
    });
  }

  function closeAll() {
    document.querySelectorAll(".notification-dropdown.show").forEach((dropdown) => {
      dropdown.classList.remove("show");
    });

    document
      .querySelectorAll('[aria-label="Notificaciones"][aria-expanded="true"]')
      .forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  global.HgaNotificationService = {
    getToken,
    loadNotifications,
    markNotificationAsRead,
    normalizeNotificationList,
    formatNotificationDate,
    getNotificationIcon,
    clearSession,
    redirectToLogin,
    requestJson,
  };

  global.HgaNotificationMenu = {
    init,
    closeAll,
    refresh: async () => {
      state.loaded = false;
      state.error = "";
      await loadNotifications({ force: true });
      return state.items;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})(window);
