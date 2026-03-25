(function (global) {
  const DEFAULT_ITEMS = [
    { label: "Nueva actualizacion en sistema" },
    { label: "Reporte mensual generado" },
  ];

  const VIEW_ALL_LABEL = "Ver todas las notificaciones";
  const VIEW_ALL_HREF = "Notificaciones.html";

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
        min-width: 250px;
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
    `;

    document.head.appendChild(style);
  }

  function createMenuItem(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "notification-menu-item";
    button.textContent = item.label;

    if (typeof item.onClick === "function") {
      button.addEventListener("click", item.onClick);
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

  function createDropdown(items) {
    const dropdown = document.createElement("div");
    dropdown.className = "notification-dropdown";
    dropdown.setAttribute("role", "menu");

    items.forEach((item) => {
      dropdown.appendChild(createMenuItem(item));
    });

    dropdown.appendChild(createViewAllItem());
    return dropdown;
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
    dropdown.classList.remove("show");
    button.setAttribute("aria-expanded", "false");
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

  function setupButton(button, items) {
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
    const dropdown = existingDropdown || createDropdown(items);

    if (!existingDropdown) {
      wrapper.appendChild(dropdown);
    }

    const closeMenu = () => closeDropdown(dropdown, button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      closeProfileDropdownIfOpen();

      const isOpen = dropdown.classList.toggle("show");
      button.setAttribute("aria-expanded", String(isOpen));
    });

    dropdown.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.target;

      if (target instanceof HTMLAnchorElement || target instanceof HTMLButtonElement) {
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

  function init(options = {}) {
    const items = Array.isArray(options.items) && options.items.length > 0 ? options.items : DEFAULT_ITEMS;
    const buttons = document.querySelectorAll('[aria-label="Notificaciones"]');

    buttons.forEach((button) => {
      setupButton(button, items);
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

  global.HgaNotificationMenu = {
    init,
    closeAll,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})(window);
