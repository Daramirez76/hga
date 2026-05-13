(function (global) {
  const DEFAULT_CONFIG = {
    userPageHref: "user.html",
    loginPageHref: document.body?.dataset?.loginPage?.trim() || "login.html",
  };

  let currentConfig = { ...DEFAULT_CONFIG };

  function ensureStyles() {
    if (document.getElementById("hga-user-menu-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "hga-user-menu-styles";
    style.textContent = `
      .profile-menu-wrapper {
        position: relative;
      }

      .profile-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        min-width: 220px;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(200, 230, 201, 0.8);
        border-radius: 14px;
        box-shadow: 0 12px 24px rgba(46, 125, 50, 0.15);
        overflow: hidden;
        opacity: 0;
        transform: translateY(-8px);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 25;
      }

      .profile-dropdown.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .profile-menu-item {
        width: 100%;
        border: 0;
        background: transparent;
        color: #2e7d32;
        text-align: left;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s ease, color 0.2s ease;
      }

      .profile-menu-item:hover,
      .profile-menu-item:focus-visible {
        background: linear-gradient(135deg, #e8f5e9, #d9f0ee);
        color: #1b5e20;
        outline: none;
      }

      .profile-menu-item + .profile-menu-item {
        border-top: 1px solid rgba(200, 230, 201, 0.7);
      }
    `;

    document.head.appendChild(style);
  }

  function createMenuItem(id, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "profile-menu-item";
    button.id = id;
    button.textContent = label;
    return button;
  }

  function createDropdown() {
    const dropdown = document.createElement("div");
    dropdown.className = "profile-dropdown";
    dropdown.id = "profileDropdown";
    dropdown.appendChild(createMenuItem("viewUserProfile", "Ver perfil de usuario"));
    dropdown.appendChild(createMenuItem("logoutUser", "Cerrar sesión"));
    return dropdown;
  }

  function wrapButton(button) {
    const wrapper = document.createElement("div");
    wrapper.className = "profile-menu-wrapper";

    const parent = button.parentNode;
    parent.insertBefore(wrapper, button);
    wrapper.appendChild(button);

    return wrapper;
  }

  function getElements() {
    const button = document.getElementById("profileMenuButton");
    if (!(button instanceof HTMLElement)) {
      return null;
    }

    const wrapper = button.parentElement && button.parentElement.classList.contains("profile-menu-wrapper")
      ? button.parentElement
      : wrapButton(button);

    let dropdown = wrapper.querySelector("#profileDropdown");
    if (!dropdown) {
      dropdown = createDropdown();
      wrapper.appendChild(dropdown);
    }

    const viewUserProfile = dropdown.querySelector("#viewUserProfile");
    const logoutUser = dropdown.querySelector("#logoutUser");

    return { button, wrapper, dropdown, viewUserProfile, logoutUser };
  }

  function closeMenu(elements) {
    if (!elements) {
      return;
    }

    elements.dropdown.classList.remove("show");
    elements.button.setAttribute("aria-expanded", "false");
  }

  function closeNotificationsMenuIfOpen() {
    if (global.HgaNotificationMenu && typeof global.HgaNotificationMenu.closeAll === "function") {
      global.HgaNotificationMenu.closeAll();
      return;
    }

    document.querySelectorAll(".notification-dropdown.show").forEach((dropdown) => {
      dropdown.classList.remove("show");
    });

    document
      .querySelectorAll('[aria-label="Notificaciones"][aria-expanded="true"]')
      .forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  function defaultViewProfile() {
    const welcomePanel = document.getElementById("welcome");
    const panels = document.querySelectorAll(".panel");

    if (welcomePanel && panels.length > 0) {
      panels.forEach((panel) => panel.classList.remove("active"));
      welcomePanel.classList.add("active");
      return;
    }

    global.location.href = currentConfig.userPageHref;
  }

  function defaultLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("usuario");
    global.location.href = currentConfig.loginPageHref;
  }

  function init(options = {}) {
    const elements = getElements();
    if (!elements || elements.button.dataset.userMenuReady === "true") {
      return;
    }

    ensureStyles();
    currentConfig = { ...DEFAULT_CONFIG, ...options };

    const onViewProfile = typeof options.onViewProfile === "function"
      ? options.onViewProfile
      : defaultViewProfile;

    const onLogout = typeof options.onLogout === "function"
      ? options.onLogout
      : defaultLogout;

    elements.button.dataset.userMenuReady = "true";

    const closeCurrentMenu = () => closeMenu(elements);

    elements.button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // reparacion menu usuario
      if (global.HgaNotificationMenu?.closeAll) global.HgaNotificationMenu.closeAll();
      if (global.HgaHamburgerMenu?.closeAll) global.HgaHamburgerMenu.closeAll();
      if (global.HgaUserMenu?.closeAll) global.HgaUserMenu.closeAll();

      const isOpen = elements.dropdown.classList.toggle("show");
      elements.button.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!elements.wrapper.contains(event.target)) {
        closeCurrentMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCurrentMenu();
      }
    });

    elements.dropdown.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    if (elements.viewUserProfile) {
      elements.viewUserProfile.addEventListener("click", () => {
        closeCurrentMenu();
        onViewProfile();
      });
    }

    if (elements.logoutUser) {
      elements.logoutUser.addEventListener("click", () => {
        closeCurrentMenu();
        onLogout();
      });
    }
  }

  function closeAll() {
    const elements = getElements();
    closeMenu(elements);
  }

  global.HgaUserMenu = {
    init,
    closeAll,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})(window);
