const API_ME_ENDPOINT = `${window.location.origin}/api/me`;
const API_LOGOUT_ENDPOINT = `${window.location.origin}/api/logout`;

const buttons = document.querySelectorAll(".menu-btn");
const panels = document.querySelectorAll(".panel");

function splitFullName(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeUser(userData) {
  const user = userData || {};
  const fullName = String(user.name || "").trim();
  const parsedName = splitFullName(fullName);
  const roleMap = {
    1: "Administrador",
    2: "Enfermero",
    3: "Doctor",
    4: "Tutor",
  };
  const roleFromApi = String(user.rol || user.role || "").trim();
  const roleCode = Number(user.cod_rol || user.role_code || 0);

  return {
    id: user.id || "",
    fullName,
    firstName: String(user.nombre || parsedName.firstName || "").trim(),
    lastName: String(user.apellido || parsedName.lastName || "").trim(),
    email: String(user.email || "").trim(),
    phone: String(user.telefono || "").trim(),
    username: String(user.username || user.usuario || "").trim(),
    role: roleFromApi || roleMap[roleCode] || "Tutor",
  };
}

function renderUserProfile(profile) {
  const sidebarUserName = document.getElementById("sidebarUserName");
  const welcomeUserName = document.getElementById("welcomeUserName");
  const welcomeUserEmail = document.getElementById("welcomeUserEmail");
  const welcomeUserPhone = document.getElementById("welcomeUserPhone");
  const profileInputName = document.getElementById("profileInputName");
  const profileInputEmail = document.getElementById("profileInputEmail");
  const profileInputPhone = document.getElementById("profileInputPhone");
  const sidebarUserRole = document.getElementById("sidebarUserRole");

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.fullName || "Usuario";
  const email = profile.email || "No registrado";
  const phone = profile.phone || "No registrado";

  if (sidebarUserName) sidebarUserName.textContent = fullName;
  if (welcomeUserName) welcomeUserName.textContent = fullName;
  if (welcomeUserEmail) welcomeUserEmail.textContent = email;
  if (welcomeUserPhone) welcomeUserPhone.textContent = phone;
  if (profileInputName) profileInputName.value = fullName;
  if (profileInputEmail) profileInputEmail.value = profile.email;
  if (profileInputPhone) profileInputPhone.value = profile.phone;
  if (sidebarUserRole) sidebarUserRole.textContent = profile.role || "Tutor";
}

async function fetchCurrentUser() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(API_ME_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.user) {
      localStorage.setItem("usuario", JSON.stringify(data.user));
      return data.user;
    }
  } catch {
    return null;
  }

  return null;
}

async function loadProfileData() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const storedUser = readStoredUser();
  if (storedUser) {
    renderUserProfile(normalizeUser(storedUser));
  }

  const apiUser = await fetchCurrentUser();
  const sourceUser = apiUser || storedUser;

  if (!sourceUser) {
    window.location.href = "login.html";
    return;
  }

  renderUserProfile(normalizeUser(sourceUser));
}

async function logoutSession() {
  const token = localStorage.getItem("access_token");

  if (token) {
    try {
      await fetch(API_LOGOUT_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignorar error de red en logout; igual se limpia la sesión local.
    }
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;

    panels.forEach((panel) => {
      panel.classList.remove("active");
    });

    const targetPanel = document.getElementById(target);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }
  });
});

function initUserProfilePage() {
  if (window.HgaUserMenu) {
    window.HgaUserMenu.init({
      onViewProfile: () => {
        const welcomePanel = document.getElementById("welcome");
        if (welcomePanel) {
          panels.forEach((panel) => panel.classList.remove("active"));
          welcomePanel.classList.add("active");
        }
      },
      onLogout: logoutSession,
    });
  }

  loadProfileData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUserProfilePage);
} else {
  initUserProfilePage();
}

