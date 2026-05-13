(function (global) {
  const DEFAULT_ITEMS = [
    { label: "residentes", href: "resident.html" },
    { label: "Informes", href: "Informes.html" },
    { label: "Visitas", href: "Visitas.html" },
    { label: "Citas", href: "citas_medicas.html" },
    { label: "Actividades Ludicas", href: "recreational_activities.html" },
    { label: "Medicamentos", href: "medicaments.html" },
    { label: "dashboard", href: "dashboard.html" },
  ];

  function ensureStyles() {
    if (document.getElementById("hga-hamburger-menu-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "hga-hamburger-menu-styles";
    style.textContent = `
      .hamburger-menu-wrapper {
        position: relative;
      }

      .hamburger-dropdown {
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
        z-index: 90;
      }

      .hamburger-dropdown.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .hamburger-menu-item {
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

      .hamburger-menu-item:hover,
      .hamburger-menu-item:focus-visible {
        background: linear-gradient(135deg, #e8f5e9, #d9f0ee);
        color: #1b5e20;
        outline: none;
      }

      .hamburger-menu-item + .hamburger-menu-item {
        border-top: 1px solid rgba(200, 230, 201, 0.7);
      }
    `;

    document.head.appendChild(style);
  }

  function createMenuItem(item) {
    const link = document.createElement("a");
    link.className = "hamburger-menu-item";
    link.href = item.href || "#";
    link.textContent = item.label || "";
    return link;
  }

  function createDropdown(items) {
    const dropdown = document.createElement("div");
    dropdown.className = "hamburger-dropdown";
    dropdown.setAttribute("role", "menu");

    items.forEach((item) => {
      dropdown.appendChild(createMenuItem(item));
    });

    return dropdown;
  }

  function wrapButton(button) {
    const wrapper = document.createElement("div");
    wrapper.className = "hamburger-menu-wrapper";

    const parent = button.parentNode;
    parent.insertBefore(wrapper, button);
    wrapper.appendChild(button);

    return wrapper;
  }

  function closeProfileMenuIfOpen() {
    if (global.HgaUserMenu && typeof global.HgaUserMenu.closeAll === "function") {
      global.HgaUserMenu.closeAll();
    }

    const legacyProfileDrop = document.getElementById("profileDrop");
    if (legacyProfileDrop instanceof HTMLElement) {
      legacyProfileDrop.classList.remove("show");
    }
  }

  function closeNotificationMenuIfOpen() {
    if (global.HgaNotificationMenu && typeof global.HgaNotificationMenu.closeAll === "function") {
      global.HgaNotificationMenu.closeAll();
    }
  }

  function setupButton(button, items) {
    if (!(button instanceof HTMLElement) || button.dataset.hamburgerMenuReady === "true") {
      return;
    }

    ensureStyles();

    button.dataset.hamburgerMenuReady = "true";
    button.removeAttribute("onclick");
    button.removeAttribute("data-bs-toggle");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");

    const wrapper = button.parentElement && button.parentElement.classList.contains("hamburger-menu-wrapper")
      ? button.parentElement
      : wrapButton(button);

    const existingDropdown = wrapper.querySelector(".hamburger-dropdown");
    const dropdown = existingDropdown || createDropdown(items);

    if (!existingDropdown) {
      wrapper.appendChild(dropdown);
    }

    const closeMenu = () => {
      dropdown.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    };

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Reparacion menu desplegable
      if (global.HgaUserMenu?.closeAll) global.HgaUserMenu.closeAll();
      if (global.HgaNotificationMenu?.closeAll) global.HgaNotificationMenu.closeAll();
      if (global.HgaHamburgerMenu?.closeAll) global.HgaHamburgerMenu.closeAll();

      const isOpen = dropdown.classList.toggle("show");
      button.setAttribute("aria-expanded", String(isOpen));
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
  }

  function init(options = {}) {
    const roleItems = global.HgaRoleAccess && typeof global.HgaRoleAccess.getMenuItems === "function"
      ? global.HgaRoleAccess.getMenuItems()
      : [];
    const items = Array.isArray(options.items) && options.items.length > 0
      ? options.items
      : roleItems.length > 0
        ? roleItems
        : DEFAULT_ITEMS;
    const buttons = document.querySelectorAll('[data-menu-hamburguesa], [aria-label="Menu"], [aria-label="Menú"]');

    buttons.forEach((button) => {
      setupButton(button, items);
    });
  }

  function closeAll() {
    document.querySelectorAll(".hamburger-dropdown.show").forEach((dropdown) => {
      dropdown.classList.remove("show");
    });

    document
      .querySelectorAll('[data-menu-hamburguesa][aria-expanded="true"], [aria-label="Menu"][aria-expanded="true"], [aria-label="Menú"][aria-expanded="true"]')
      .forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  global.HgaHamburgerMenu = {
    init,
    closeAll,
  };

  function boot() {
    if (global.HgaRoleAccess && typeof global.HgaRoleAccess.ready === "function") {
      Promise.resolve(global.HgaRoleAccess.ready())
        .catch(() => null)
        .finally(() => init());
      return;
    }

    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
