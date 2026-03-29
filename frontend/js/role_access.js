(function (global) {
  const ROLE_ADMIN = 1;
  const ROLE_NURSE = 2;
  const ROLE_TUTOR = 4;
  const API_ME_ENDPOINT = `${global.location.origin}/api/me`;
  const ROLE_NAMES = {
    [ROLE_ADMIN]: "Administrador",
    [ROLE_NURSE]: "Enfermero",
    [ROLE_TUTOR]: "Tutor",
  };

  const ROLE_MENU_ITEMS = {
    [ROLE_ADMIN]: [
      { label: "Inicio", href: "home_employees.html" },
      { label: "residentes", href: "resident.html" },
      { label: "Informes", href: "Informes.html" },
      { label: "Visitas", href: "Visitas.html" },
      { label: "Citas", href: "citas_medicas.html" },
      { label: "Actividades Ludicas", href: "recreational_activities.html" },
      { label: "Medicamentos", href: "medicaments.html" },
      { label: "dashboard", href: "dashboard.html" },
    ],
    [ROLE_NURSE]: [
      { label: "Inicio", href: "home_employees.html" },
      { label: "residentes", href: "resident.html" },
      { label: "Informes", href: "Informes.html" },
      { label: "Visitas", href: "Visitas.html" },
      { label: "Citas", href: "citas_medicas.html" },
      { label: "Actividades Ludicas", href: "recreational_activities.html" },
      { label: "Medicamentos", href: "medicaments.html" },
    ],
    [ROLE_TUTOR]: [
      { label: "Inicio", href: "home.html" },
      { label: "Residente", href: "resident.html" },
      { label: "Actividades Ludicas", href: "recreational_activities.html" },
    ],
  };

  let currentUser = null;
  let readyPromise = null;

  function markPageReady() {
    global.document.documentElement.classList.remove("hga-access-pending");
  }

  function getToken() {
    return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
  }

  function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("usuario");
  }

  function getStoredUser() {
    if (currentUser) {
      return currentUser;
    }

    try {
      const raw = localStorage.getItem("usuario");
      currentUser = raw ? JSON.parse(raw) : null;
      return currentUser;
    } catch {
      return null;
    }
  }

  function setStoredUser(user) {
    if (!user || typeof user !== "object") {
      return;
    }

    currentUser = user;
    localStorage.setItem("usuario", JSON.stringify(user));
  }

  function getRoleCode(user = getStoredUser()) {
    return Number(user?.cod_rol || user?.role_code || 0);
  }

  function getRoleName(roleCode = getRoleCode()) {
    return ROLE_NAMES[roleCode] || "Usuario";
  }

  function parseAllowedRoles() {
    const raw = document.body?.dataset?.allowedRoles || "";
    return raw
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  function getLoginPage() {
    return document.body?.dataset?.loginPage?.trim() || "login.html";
  }

  function getRoleHome(roleCode = getRoleCode()) {
    return roleCode === ROLE_TUTOR ? "home.html" : "home_employees.html";
  }

  function hasAnyRole(allowedRoles, user = getStoredUser()) {
    const roleCode = getRoleCode(user);
    return Array.isArray(allowedRoles) && allowedRoles.includes(roleCode);
  }

  function getMenuItems(user = getStoredUser()) {
    return ROLE_MENU_ITEMS[getRoleCode(user)] || [];
  }

  async function fetchCurrentUser() {
    const token = getToken();

    if (!token) {
      return null;
    }

    try {
      const response = await fetch(API_ME_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return null;
      }

      if (response.ok && data?.user) {
        setStoredUser(data.user);
        return data.user;
      }
    } catch {
      // Si falla la sincronización, usamos la sesión local disponible.
    }

    return getStoredUser();
  }

  function redirectToLogin() {
    clearSession();
    global.location.replace(getLoginPage());
  }

  function redirectToRoleHome(user = getStoredUser()) {
    const roleHome = getRoleHome(getRoleCode(user));
    global.location.replace(roleHome);
  }

  function applyUserToBody(user) {
    if (!(document.body instanceof HTMLElement)) {
      return;
    }

    document.body.dataset.roleCode = String(getRoleCode(user));
    document.body.dataset.roleName = getRoleName(getRoleCode(user));
  }

  async function enforcePageAccess() {
    const allowedRoles = parseAllowedRoles();

    if (allowedRoles.length === 0) {
      markPageReady();
      return;
    }

    if (!getToken()) {
      redirectToLogin();
      return;
    }

    const storedUser = getStoredUser();

    if (storedUser) {
      if (!hasAnyRole(allowedRoles, storedUser)) {
        redirectToRoleHome(storedUser);
        return;
      }

      applyUserToBody(storedUser);
      markPageReady();
    }

    const user = await fetchCurrentUser();

    if (!user) {
      redirectToLogin();
      return;
    }

    if (!hasAnyRole(allowedRoles, user)) {
      redirectToRoleHome(user);
      return;
    }

    applyUserToBody(user);
    markPageReady();
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = Promise.resolve(enforcePageAccess());
    }

    return readyPromise;
  }

  global.HgaRoleAccess = {
    ROLE_ADMIN,
    ROLE_NURSE,
    ROLE_TUTOR,
    clearSession,
    enforcePageAccess,
    fetchCurrentUser,
    getLoginPage,
    getMenuItems,
    getRoleCode,
    getRoleName,
    getStoredUser,
    getToken,
    hasAnyRole,
    ready,
    redirectToLogin,
    redirectToRoleHome,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void ready();
    });
  } else {
    void ready();
  }
})(window);
