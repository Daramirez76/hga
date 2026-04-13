(function () {
  const currentScript = document.currentScript;
  const documentElement = document.documentElement;
  const STYLE_ID = "hga-access-bootstrap-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = "html.hga-access-pending body{visibility:hidden;}";
    document.head.appendChild(style);
  }

  function parseAllowedRoles(rawValue) {
    return String(rawValue || "")
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  function readStoredUser() {
    try {
      const rawUser = localStorage.getItem("usuario");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }

  function getStoredToken() {
    return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
  }

  function getRoleCode(user) {
    return Number(user?.cod_rol || user?.role_code || 0);
  }

  function getRoleHome(roleCode, tutorHome, staffHome) {
    return roleCode === 4 ? tutorHome : staffHome;
  }

  injectStyle();
  documentElement.classList.add("hga-access-pending");

  const allowedRoles = parseAllowedRoles(currentScript?.dataset?.allowedRoles);
  const loginPage = String(currentScript?.dataset?.loginPage || "login.html").trim() || "login.html";
  const tutorHome = String(currentScript?.dataset?.tutorHome || "home.html").trim() || "home.html";
  const staffHome = String(currentScript?.dataset?.staffHome || "home_employees.html").trim() || "home_employees.html";

  if (allowedRoles.length === 0) {
    documentElement.classList.remove("hga-access-pending");
    return;
  }

  if (!getStoredToken()) {
    window.location.replace(loginPage);
    return;
  }

  const storedUser = readStoredUser();
  const roleCode = getRoleCode(storedUser);

  if (!roleCode) {
    return;
  }

  if (!allowedRoles.includes(roleCode)) {
    window.location.replace(getRoleHome(roleCode, tutorHome, staffHome));
    return;
  }
})();
