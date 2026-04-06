const VISITAS_API_URL = `${window.location.origin}/api/visitas`;
const RESIDENTES_API_URL = `${window.location.origin}/api/residentes`;
const PROFILE_API_URL = `${window.location.origin}/api/me`;
const NOTIF_API_URL = `${window.location.origin}/api/notificaciones`;
const LOGIN_URL = "login.html";
const VISITAS_PAGE_SIZE = window.HgaPagination?.DEFAULT_PAGE_SIZE || 5;

const visitasState = {
  items: [],
  residents: [],
  currentUser: null,
  pagination: {
    currentPage: 1,
    perPage: VISITAS_PAGE_SIZE,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
    serverPaginated: false,
  },
  paginationHost: null,
  searchQuery: "",
  editingId: null,
  isSubmitting: false,
  residentLoadError: "",
};

const dom = {
  searchInput: null,
  clearFilterButton: null,
  newButton: null,
  banner: null,
  visitsCountBadge: null,
  residentsCountBadge: null,
  sessionSummaryBadge: null,
  listContainer: null,
  formBackdrop: null,
  formPanel: null,
  form: null,
  formTitle: null,
  formSubtitle: null,
  sessionSummary: null,
  cancelButton: null,
  closeButton: null,
  saveButton: null,
  codigoInput: null,
  usuarioInput: null,
  residenteSelect: null,
  docIdInput: null,
  visitanteInput: null,
  fechaInput: null,
  // Nuevos elementos predictivos
  fechaVisitaSelect: null,
  bloqueHorario: null,
  visitWeekWarning: null,
};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  wireEvents();
  void bootstrapVisitas();
});

function cacheDom() {
  dom.searchInput = document.getElementById("searchVisitas");
  dom.clearFilterButton = document.getElementById("btnLimpiarFiltro");
  dom.newButton = document.getElementById("btnNuevaVisita");
  dom.banner = document.getElementById("visitasBanner");
  dom.visitsCountBadge = document.getElementById("visitasCountBadge");
  dom.residentsCountBadge = document.getElementById("residentesCountBadge");
  dom.sessionSummaryBadge = document.getElementById("sessionSummaryBadge");
  dom.listContainer = document.getElementById("listaVisitasContainer");
  dom.formBackdrop = document.getElementById("formBackdrop");
  dom.formPanel = document.getElementById("formPanel");
  dom.form = document.getElementById("formNuevaVisita");
  dom.formTitle = document.getElementById("formTitle");
  dom.formSubtitle = document.getElementById("formSubtitle");
  dom.sessionSummary = document.getElementById("visitSessionSummary");
  dom.cancelButton = document.getElementById("btnCancelarVisita");
  dom.closeButton = document.getElementById("btnCerrarFormulario");
  dom.saveButton = document.getElementById("btnGuardarVisita");
  dom.codigoInput = document.getElementById("codVisitas");
  dom.usuarioInput = document.getElementById("codUsuario");
  dom.residenteSelect = document.getElementById("codResidente");
  dom.docIdInput = document.getElementById("docId");
  dom.visitanteInput = document.getElementById("nombVisitante");
  dom.fechaInput = document.getElementById("fechaVisita");
  
  // Caché de nuevos elementos
  dom.fechaVisitaSelect = document.getElementById("fechaVisitaSelect");
  dom.bloqueHorario = document.getElementById("bloqueHorario");
  dom.visitWeekWarning = document.getElementById("visitWeekWarning");
}

function wireEvents() {
  if (dom.newButton instanceof HTMLButtonElement) {
    dom.newButton.addEventListener("click", () => openCreateForm());
  }

  if (dom.clearFilterButton instanceof HTMLButtonElement) {
    dom.clearFilterButton.addEventListener("click", () => {
      if (dom.searchInput instanceof HTMLInputElement) {
        dom.searchInput.value = "";
      }
      visitasState.searchQuery = "";
      void loadVisits(1, { force: true });
    });
  }

  if (dom.searchInput instanceof HTMLInputElement) {
    dom.searchInput.addEventListener("input", filtrarVisitas);
  }

  if (dom.listContainer instanceof HTMLElement) {
    dom.listContainer.addEventListener("click", handleListClick);
  }

  if (dom.form instanceof HTMLFormElement) {
    dom.form.addEventListener("submit", handleFormSubmit);
  }

  if (dom.cancelButton instanceof HTMLButtonElement) {
    dom.cancelButton.addEventListener("click", closeForm);
  }

  if (dom.closeButton instanceof HTMLButtonElement) {
    dom.closeButton.addEventListener("click", closeForm);
  }

  if (dom.formBackdrop instanceof HTMLElement) {
    dom.formBackdrop.addEventListener("click", closeForm);
  }

  // Evento para la interfaz predictiva de horas
  if (dom.fechaVisitaSelect instanceof HTMLSelectElement) {
    dom.fechaVisitaSelect.addEventListener("change", handleFechaChange);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeForm();
    }
  });
}

async function bootstrapVisitas() {
  if (!getStoredToken()) {
    window.location.href = LOGIN_URL;
    return;
  }

  showBanner("Cargando visitas, residentes y sesión activa...", "info");

  try {
    const [userResult, residentResult] = await Promise.allSettled([
      loadCurrentUser(),
      loadResidents(),
    ]);

    if (userResult.status === "rejected") {
      console.warn("No fue posible cargar /api/me:", userResult.reason);
      applyStoredUserFallback();
    }

    if (residentResult.status === "rejected") {
      console.warn("No fue posible cargar /api/residentes:", residentResult.reason);
      visitasState.residentLoadError = "No fue posible cargar la lista de residentes.";
    }

    await loadVisits();
    updateCounters();
    refreshSessionSummary();

    if (visitasState.residentLoadError) {
      showBanner(`${visitasState.residentLoadError} El listado de visitas sigue disponible, pero crear/editar queda limitado.`, "warning");
    } else {
      showBanner("", "info");
    }
  } catch (error) {
    console.error("Error al iniciar el módulo de visitas:", error);
    showBanner(`No fue posible preparar el módulo: ${error.message}`, "danger");
    renderVisits();
  }
}

function getStoredToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
}

function clearStoredSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuario");
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function syncStoredUser(user) {
  try {
    const storedUser = readStoredUser() || {};
    localStorage.setItem("usuario", JSON.stringify({ ...storedUser, ...user }));
  } catch (error) {
    console.warn("No fue posible sincronizar el usuario:", error);
  }
}

function getCurrentUserId() {
  const candidate = visitasState.currentUser?.id ?? visitasState.currentUser?.cod_usuario ?? readStoredUser()?.id ?? readStoredUser()?.cod_usuario ?? "";
  const parsed = Number.parseInt(String(candidate), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getCurrentUserLabel() {
  return visitasState.currentUser?.displayName || "Usuario no disponible";
}

function buildHeaders(includeJson = true) {
  const headers = {
    Accept: "application/json",
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function handleUnauthorized() {
  clearStoredSession();

  if (window.HgaAlerts?.warning) {
    try {
      await window.HgaAlerts.warning("Tu sesión expiró. Vuelve a iniciar sesión.", "Sesión requerida");
    } catch {
      // Si el modal falla, igual redirigimos.
    }
  }

  window.location.href = LOGIN_URL;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await readJsonResponse(response);

  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error("Sesion expirada");
  }

  if (!response.ok) {
    throw new Error(resolveRequestErrorMessage(data, response.status));
  }

  return data;
}

function resolveRequestErrorMessage(data, status) {
  if (data && typeof data === "object") {
    if (data.errors && typeof data.errors === "object") {
      for (const value of Object.values(data.errors)) {
        if (Array.isArray(value) && value.length > 0) {
          return value.join("\n");
        }
      }
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return `Error HTTP ${status}`;
}

function toInteger(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function normalizeCurrentUser(payload) {
  const source = payload || {};
  const id = toInteger(source.id ?? source.cod_usuario ?? source.codUser ?? source.user_id);
  const firstName = String(source.nombre ?? source.name ?? "").trim();
  const lastName = String(source.apellido ?? source.last_name ?? "").trim();
  const username = String(source.username ?? source.usuario ?? "").trim();
  const email = String(source.email ?? "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim()
    || String(source.full_name ?? "").trim()
    || username
    || email
    || `Usuario #${id ?? "sin id"}`;

  return {
    raw: source,
    id: id ?? 0,
    displayName,
    email,
  };
}

function normalizeResident(item) {
  const source = item || {};
  const code = toInteger(source.cod_residente ?? source.id ?? source.codResidente);
  const label = [source.nombre, source.apellido].map((value) => String(value ?? "").trim()).filter(Boolean).join(" ");

  return {
    raw: source,
    code: code ?? 0,
    label: label || (code ? `Residente ${code}` : "Residente"),
  };
}

function normalizeVisit(item) {
  const source = item || {};
  const resourceId = toInteger(source.id ?? source.visita_id ?? source.visitaId);
  const codeValue = source.cod_Visitas ?? source.cod_visitas ?? "";
  const codeNumber = toInteger(codeValue);
  const residentCode = toInteger(source.cod_Residente ?? source.cod_residente ?? source.resident_id);
  const userCode = toInteger(source.cod_usuario ?? source.codUser ?? source.user_id);

  return {
    raw: source,
    id: resourceId ?? codeNumber ?? String(codeValue),
    resourceId: resourceId ?? null,
    codeNumber: codeNumber ?? null,
    codeLabel: String(codeValue || codeNumber || resourceId || "").trim(),
    docId: String(source.doc_id ?? source.docId ?? "").trim(),
    visitorName: String(source.Nomb_visitante ?? source.nomb_visitante ?? source.visitor_name ?? "").trim(),
    residentCode: residentCode ?? 0,
    visitDate: String(source.Fecha_Visita ?? source.fecha_visita ?? source.fecha ?? "").trim(),
    userCode: userCode ?? 0,
  };
}

function formatDateDisplay(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "Sin fecha";
  }

  const datePart = normalized.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    return normalized;
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function getResidentLabel(code) {
  const resident = visitasState.residents.find((item) => String(item.code) === String(code));
  return resident ? resident.label : (code ? `Residente ${code}` : "Sin residente");
}

function getUserLabel(code) {
  if (!code) {
    return "Sin usuario";
  }

  if (String(code) === String(getCurrentUserId())) {
    return getCurrentUserLabel();
  }

  return `Usuario #${code}`;
}

function getSearchTerm() {
  return dom.searchInput instanceof HTMLInputElement ? dom.searchInput.value.trim() : "";
}

function getPaginationHost() {
  if (visitasState.paginationHost instanceof HTMLElement) {
    return visitasState.paginationHost;
  }

  const list = dom.listContainer;
  if (!(list instanceof HTMLElement)) {
    return null;
  }

  visitasState.paginationHost = window.HgaPagination?.ensureHost
    ? window.HgaPagination.ensureHost(list, "visitasPagination")
    : null;

  return visitasState.paginationHost;
}

function renderVisitsPagination() {
  const host = getPaginationHost();

  if (!(host instanceof HTMLElement) || !window.HgaPagination) {
    return;
  }

  window.HgaPagination.renderControls(host, visitasState.pagination, (page) => {
    void loadVisits(page, { force: true });
  }, {
    itemLabel: "visitas",
    ariaLabel: "Paginación de visitas",
  });
}

function getNextVisitCode() {
  const highest = visitasState.items.reduce((max, item) => {
    if (Number.isFinite(item.codeNumber)) {
      return Math.max(max, item.codeNumber);
    }
    return max;
  }, 0);

  return highest + 1;
}

function updateCounters() {
  if (dom.visitsCountBadge instanceof HTMLElement) {
    const totalVisits = visitasState.pagination.total > 0 ? visitasState.pagination.total : visitasState.items.length;
    dom.visitsCountBadge.textContent = `${totalVisits} ${totalVisits === 1 ? "visita" : "visitas"}`;
  }

  if (dom.residentsCountBadge instanceof HTMLElement) {
    dom.residentsCountBadge.textContent = `${visitasState.residents.length} ${visitasState.residents.length === 1 ? "residente" : "residentes"}`;
  }

  if (dom.sessionSummaryBadge instanceof HTMLElement) {
    dom.sessionSummaryBadge.textContent = getCurrentUserId()
      ? `Sesión: ${getCurrentUserLabel()}`
      : "Sesión no disponible";
  }
}

function refreshSessionSummary() {
  if (dom.sessionSummary instanceof HTMLElement) {
    dom.sessionSummary.textContent = getCurrentUserId()
      ? `Sesión activa: ${getCurrentUserLabel()} | Usuario #${getCurrentUserId()}`
      : "Sesión no disponible";
  }

  if (dom.usuarioInput instanceof HTMLInputElement) {
    dom.usuarioInput.value = getCurrentUserId() ? String(getCurrentUserId()) : "";
  }
}

function showBanner(message, variant = "info") {
  if (!(dom.banner instanceof HTMLElement)) {
    return;
  }

  if (!message) {
    dom.banner.className = "visitas-banner alert d-none mb-3";
    dom.banner.textContent = "";
    return;
  }

  dom.banner.className = `visitas-banner alert alert-${variant} mb-3`;
  dom.banner.textContent = message;
}

function renderResidentOptions(selectedValue = "") {
  if (!(dom.residenteSelect instanceof HTMLSelectElement)) {
    return;
  }

  dom.residenteSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = visitasState.residents.length > 0 ? "Selecciona un residente" : "No hay residentes disponibles";
  dom.residenteSelect.appendChild(placeholder);

  visitasState.residents.forEach((resident) => {
    const option = document.createElement("option");
    option.value = String(resident.code);
    option.textContent = resident.label;
    if (String(selectedValue) === String(resident.code)) {
      option.selected = true;
    }
    dom.residenteSelect.appendChild(option);
  });

  dom.residenteSelect.disabled = visitasState.residents.length === 0;
}

function renderVisits() {
  if (!(dom.listContainer instanceof HTMLElement)) {
    return;
  }

  dom.listContainer.innerHTML = "";

  if (visitasState.items.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = visitasState.searchQuery
      ? "No hay visitas que coincidan con ese filtro."
      : "Aún no hay visitas registradas.";
    dom.listContainer.appendChild(emptyState);
    renderVisitsPagination();
    return;
  }

  visitasState.items.forEach((visit) => {
    dom.listContainer.appendChild(renderVisitCard(visit));
  });

  renderVisitsPagination();
}

function renderVisitCard(visit) {
  const card = document.createElement("article");
  card.className = "visita-card";
  card.dataset.visitId = String(visit.resourceId ?? visit.id);

  const residentLabel = getResidentLabel(visit.residentCode);
  const userLabel = getUserLabel(visit.userCode);

  card.innerHTML = `
    <div class="visita-card__top">
      <div>
        <div class="visita-code">Visita #${escapeHtml(visit.codeLabel || visit.id)}</div>
        <h3 class="visita-title h6">${escapeHtml(visit.visitorName || "Sin nombre")}</h3>
      </div>
      <div class="visita-actions">
        <button type="button" class="btn btn-sm btn-soft" data-action="edit">Editar</button>
        <button type="button" class="btn btn-sm btn-danger" data-action="delete">Eliminar</button>
      </div>
    </div>
    <div class="visita-meta">
      <span class="visita-chip">Documento: ${escapeHtml(visit.docId || "—")}</span>
      <span class="visita-chip">${escapeHtml(residentLabel)}</span>
      <span class="visita-chip">${escapeHtml(formatDateDisplay(visit.visitDate))}</span>
      <span class="visita-chip">${escapeHtml(userLabel)}</span>
    </div>
  `;

  return card;
}

function handleListClick(event) {
  const button = event.target instanceof HTMLElement ? event.target.closest("[data-action]") : null;
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const card = button.closest("[data-visit-id]");
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const visit = findVisitById(card.dataset.visitId);
  if (!visit) {
    return;
  }

  if (button.dataset.action === "edit") {
    openEditForm(visit);
  }

  if (button.dataset.action === "delete") {
    void deleteVisit(visit);
  }
}

function findVisitById(id) {
  return visitasState.items.find((item) => String(item.id) === String(id));
}

async function loadCurrentUser() {
  const payload = await requestJson(PROFILE_API_URL, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const userData = payload.user || payload.data || payload;
  visitasState.currentUser = normalizeCurrentUser(userData);
  syncStoredUser(userData);
  refreshSessionSummary();
  updateCounters();
}

async function loadResidents() {
  const payload = await requestJson(RESIDENTES_API_URL, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const collection = normalizeCollection(payload);
  visitasState.residents = collection.map(normalizeResident).filter((item) => item.code);
  visitasState.residentLoadError = "";
  renderResidentOptions();
  refreshSessionSummary();
  updateCounters();
}

async function loadVisits(page = visitasState.pagination.currentPage || 1, options = {}) {
  const url = window.HgaPagination?.buildUrl
    ? window.HgaPagination.buildUrl(VISITAS_API_URL, {
        page,
        per_page: VISITAS_PAGE_SIZE,
        search: visitasState.searchQuery,
      })
    : `${VISITAS_API_URL}?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(VISITAS_PAGE_SIZE))}&search=${encodeURIComponent(visitasState.searchQuery)}`;

  const payload = await requestJson(url, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const normalized = window.HgaPagination?.normalizeResponse
    ? window.HgaPagination.normalizeResponse(payload, {
        page,
        perPage: VISITAS_PAGE_SIZE,
      })
    : {
        items: normalizeCollection(payload),
        meta: {
          currentPage: page,
          perPage: VISITAS_PAGE_SIZE,
          total: normalizeCollection(payload).length,
          lastPage: 1,
          from: 0,
          to: 0,
          serverPaginated: false,
        },
      };

  visitasState.pagination = normalized.meta;
  const collection = normalized.items.map(normalizeVisit);
  visitasState.items = normalized.meta.serverPaginated
    ? collection.slice()
    : (window.HgaPagination?.slicePage
      ? window.HgaPagination.slicePage(collection, normalized.meta.currentPage, normalized.meta.perPage)
      : collection.slice((normalized.meta.currentPage - 1) * normalized.meta.perPage, normalized.meta.currentPage * normalized.meta.perPage));
  updateCounters();
  renderVisits();
}

function filtrarVisitas() {
  visitasState.searchQuery = getSearchTerm();
  void loadVisits(1, { force: true });
}

function applyStoredUserFallback() {
  const storedUser = readStoredUser();
  if (!storedUser) {
    return;
  }

  visitasState.currentUser = normalizeCurrentUser(storedUser);
  refreshSessionSummary();
  updateCounters();
}

function ensureCanSubmit() {
  if (!getCurrentUserId()) {
    return "No fue posible identificar la sesión activa. Vuelve a cargar la página o inicia sesión de nuevo.";
  }

  if (visitasState.residents.length === 0) {
    return "No hay residentes disponibles para registrar la visita.";
  }

  return "";
}

// --- LÓGICA PREDICTIVA DE VISITAS ---

function isWithinRegistrationWindow() {
  const now = new Date();
  const day = now.getDay(); // 0 = Dom, 6 = Sáb
  const hour = now.getHours();
  // Lunes(1) a Viernes(5), entre 9:00 AM (9) y 4:00 PM (16, exclusivo)
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
}

function hasUserVisitedThisWeek() {
  if (!visitasState.items || visitasState.items.length === 0) return false;
  const userId = getCurrentUserId();
  if (!userId) return false;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Lunes
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
  endOfWeek.setHours(23, 59, 59, 999);

  return visitasState.items.some(visit => {
    if (String(visit.userCode) !== String(userId)) return false;
    // Maneja tanto formato 'YYYY-MM-DD' como 'YYYY-MM-DD HH:mm:ss'
    const datePart = visit.visitDate.slice(0, 10);
    const visitDate = new Date(datePart + "T00:00:00");
    return visitDate >= startOfWeek && visitDate <= endOfWeek;
  });
}

function generateAvailableDays() {
  const days = [];
  const today = new Date();
  
  for (let i = 1; i <= 21; i++) { // Mirar 3 semanas adelante
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const day = date.getDay();
    
    if (day >= 1 && day <= 5) { // Solo Lunes a Viernes
      days.push(date);
    }
  }
  return days;
}

function renderAvailableDays() {
  if (!dom.fechaVisitaSelect) return;
  dom.fechaVisitaSelect.innerHTML = "";

  if (!isWithinRegistrationWindow()) {
    dom.fechaVisitaSelect.innerHTML = `<option value="">Fuera de ventana (L-V, 9AM-4PM)</option>`;
    dom.fechaVisitaSelect.disabled = true;
    return;
  }

  if (hasUserVisitedThisWeek()) {
    if (dom.visitWeekWarning) {
      dom.visitWeekWarning.textContent = "Ya registraste una visita esta semana.";
      dom.visitWeekWarning.classList.remove("d-none");
    }
    dom.fechaVisitaSelect.innerHTML = `<option value="">Sin cupo semanal disponible</option>`;
    dom.fechaVisitaSelect.disabled = true;
    return;
  }

  const days = generateAvailableDays();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecciona un día laboral";
  dom.fechaVisitaSelect.appendChild(placeholder);

  const formatter = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" });

  days.forEach(date => {
    const option = document.createElement("option");
    option.value = date.toISOString().slice(0, 10);
    option.textContent = formatter.format(date).replace(/^\w/, (c) => c.toUpperCase());
    dom.fechaVisitaSelect.appendChild(option);
  });

  dom.fechaVisitaSelect.disabled = false;
}

function handleFechaChange() {
  const selectedDate = dom.fechaVisitaSelect?.value;
  if (!selectedDate) {
    dom.bloqueHorario.innerHTML = `<option value="">Primero selecciona un día</option>`;
    dom.bloqueHorario.disabled = true;
    return;
  }

  // Lógica predictiva de aforo basada en los datos cargados localmente
  renderAvailableBlocks(selectedDate);
}

function renderAvailableBlocks(dateStr) {
  if (!dom.bloqueHorario) return;
  dom.bloqueHorario.innerHTML = "<option value=";">Calculando cupo...</option>";
  dom.bloqueHorario.disabled = true;

  // Bloques fijos de 1 hora de 9:00 AM a 4:00 PM
  const blocks = ["09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00"];
  
  // Contamos visitas locales para ese día 
  const localVisitsForDay = visitasState.items.filter(v => v.visitDate && v.visitDate.startsWith(dateStr));
  
  // Extraemos las horas ya ocupadas en el array local
  const occupiedHours = new Set(localVisitsForDay.map(v => {
    const timePart = v.visitDate.split(' ')[1] || v.visitDate.slice(11, 19);
    return timePart;
  }));

  let availableCount = 0;
  dom.bloqueHorario.innerHTML = "";

  blocks.forEach(block => {
    // Si hay 6 o más locales, asumimos lleno (como ayuda visual)
    if (localVisitsForDay.length >= 6) return;

    if (!occupiedHours.has(block)) {
      const [hour] = block.split(':');
      const displayHour = `${hour}:00 - ${parseInt(hour, 10) + 1}:00`;
      
      const option = document.createElement("option");
      option.value = block;
      option.textContent = displayHour;
      dom.bloqueHorario.appendChild(option);
      availableCount++;
    }
  });

  if (availableCount === 0) {
    dom.bloqueHorario.innerHTML = `<option value="">Sin cupos disponibles para este día</option>`;
    if (dom.visitWeekWarning) {
      dom.visitWeekWarning.textContent = "Este día parece no tener cupos (Aforo máximo: 6).";
      dom.visitWeekWarning.classList.remove("d-none");
    }
  } else {
    dom.bloqueHorario.disabled = false;
    if (dom.visitWeekWarning) dom.visitWeekWarning.classList.add("d-none");
  }
}

// --- ALERTA SILENCIOSA ADMIN ---
async function triggerAdminNotification(visitPayload) {
  try {
    await fetch(NOTIF_API_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        tipo: "nueva_visita",
        mensaje: `Nuevo registro de visita: ${visitPayload.Nomb_visitante} para el ${visitPayload.Fecha_Visita}.`,
        destino: "admin_panel"
      }),
    });
  } catch (error) {
    // Silencioso: si falla la notificación, no interrumpimos al usuario
    console.warn("No se pudo enviar la notificación silenciosa al admin:", error);
  }
}

// --- FIN LÓGICA PREDICTIVA ---

function validateForm() {
  const errors = [];
  const docId = String(dom.docIdInput?.value ?? "").trim();
  const visitorName = String(dom.visitanteInput?.value ?? "").trim();
  const residentCode = toInteger(dom.residenteSelect?.value);
  const selectedDate = String(dom.fechaVisitaSelect?.value ?? "").trim();
  const selectedBlock = String(dom.bloqueHorario?.value ?? "").trim();

  if (!/^\d+$/.test(docId)) {
    errors.push("El documento del visitante debe ser numérico.");
  }

  if (!visitorName) {
    errors.push("El nombre del visitante es obligatorio.");
  }

  if (visitorName.length > 50) {
    errors.push("El nombre del visitante no puede superar 50 caracteres.");
  }

  if (!residentCode) {
    errors.push("Debes seleccionar un residente.");
  }

  if (!selectedDate) {
    errors.push("Debes seleccionar un día de visita.");
  }

  if (!selectedBlock) {
    errors.push("Debes seleccionar un bloque horario.");
  }

  const sessionError = ensureCanSubmit();
  if (sessionError) {
    errors.push(sessionError);
  }

  return errors;
}

function setFormMode(mode, visit = null) {
  const isEditing = mode === "edit" && Boolean(visit);
  visitasState.editingId = isEditing ? (visit.resourceId ?? visit.id) : null;

  if (dom.formTitle instanceof HTMLElement) {
    dom.formTitle.textContent = isEditing ? `Editar visita #${visit.codeLabel || visit.id}` : "Nueva visita";
  }

  if (dom.formSubtitle instanceof HTMLElement) {
    dom.formSubtitle.textContent = isEditing
      ? "Actualiza la visita manteniendo su codigo visible y su sesion asociada."
      : "Registra una visita real usando la sesion activa y un residente existente.";
  }

  if (dom.saveButton instanceof HTMLButtonElement) {
    dom.saveButton.textContent = isEditing ? "Actualizar visita" : "Guardar visita";
  }
}

function openCreateForm() {
  if (visitasState.residentLoadError && visitasState.residents.length === 0) {
    showBanner("No se pueden crear visitas sin cargar los residentes.", "warning");
    return;
  }

  setFormMode("create");

  if (dom.form instanceof HTMLFormElement) {
    dom.form.reset();
  }

  if (dom.codigoInput instanceof HTMLInputElement) {
    dom.codigoInput.value = "";
  }

  if (dom.usuarioInput instanceof HTMLInputElement) {
    dom.usuarioInput.value = String(getCurrentUserId() || "");
  }

  // Lógica predictiva de días y limpieza de alertas
  if (dom.visitWeekWarning) dom.visitWeekWarning.classList.add("d-none");
  renderAvailableDays();
  
  // Resetear bloque horario
  if (dom.bloqueHorario) {
    dom.bloqueHorario.innerHTML = `<option value="">Primero selecciona un día</option>`;
    dom.bloqueHorario.disabled = true;
  }

  renderResidentOptions(visitasState.residents[0]?.code ?? "");
  refreshSessionSummary();
  openFormPanel();
}

function openEditForm(visit) {
  setFormMode("edit", visit);

  if (dom.form instanceof HTMLFormElement) {
    dom.form.reset();
  }

  if (dom.codigoInput instanceof HTMLInputElement) {
    dom.codigoInput.value = String(visit.codeNumber ?? visit.id ?? "");
  }

  if (dom.usuarioInput instanceof HTMLInputElement) {
    dom.usuarioInput.value = String(visit.userCode || getCurrentUserId() || "");
  }

  if (dom.docIdInput instanceof HTMLInputElement) {
    dom.docIdInput.value = visit.docId;
  }

  if (dom.visitanteInput instanceof HTMLInputElement) {
    dom.visitanteInput.value = visit.visitorName;
  }

  // Para edición, inyectamos los valores en los nuevos selectores si existen,
  // pero los bloqueamos ya que las reglas de negocio aplican solo para creación.
  if (dom.fechaVisitaSelect) {
    dom.fechaVisitaSelect.innerHTML = `<option value="${visit.visitDate.slice(0,10)}">${formatDateDisplay(visit.visitDate)}</option>`;
    dom.fechaVisitaSelect.disabled = true;
  }
  if (dom.bloqueHorario) {
    const timePart = visit.visitDate.split(' ')[1] || visit.visitDate.slice(11, 19);
    const [hour] = timePart.split(':');
    dom.bloqueHorario.innerHTML = `<option value="${timePart}">${hour}:00 - ${parseInt(hour, 10) + 1}:00</option>`;
    dom.bloqueHorario.disabled = true;
  }

  renderResidentOptions(visit.residentCode);
  refreshSessionSummary();
  openFormPanel();
}

function openFormPanel() {
  if (dom.formBackdrop instanceof HTMLElement) {
    dom.formBackdrop.hidden = false;
    dom.formBackdrop.classList.add("show");
  }

  if (dom.formPanel instanceof HTMLElement) {
    dom.formPanel.classList.add("show");
    dom.formPanel.setAttribute("aria-hidden", "false");
  }
}

function closeForm() {
  if (visitasState.isSubmitting) {
    return;
  }

  visitasState.editingId = null;

  if (dom.formBackdrop instanceof HTMLElement) {
    dom.formBackdrop.classList.remove("show");
    dom.formBackdrop.hidden = true;
  }

  if (dom.formPanel instanceof HTMLElement) {
    dom.formPanel.classList.remove("show");
    dom.formPanel.setAttribute("aria-hidden", "true");
  }
}

function setSubmittingState(isSubmitting) {
  visitasState.isSubmitting = isSubmitting;

  if (dom.saveButton instanceof HTMLButtonElement) {
    dom.saveButton.disabled = isSubmitting;
    dom.saveButton.textContent = isSubmitting
      ? "Guardando..."
      : visitasState.editingId
        ? "Actualizar visita"
        : "Guardar visita";
  }

  if (dom.cancelButton instanceof HTMLButtonElement) {
    dom.cancelButton.disabled = isSubmitting;
  }

  if (dom.closeButton instanceof HTMLButtonElement) {
    dom.closeButton.disabled = isSubmitting;
  }
}

function buildVisitPayload() {
  const docId = toInteger(dom.docIdInput?.value);
  const residentCode = toInteger(dom.residenteSelect?.value);
  const userId = getCurrentUserId();
  
  // Combinar fecha del select y hora del bloque
  const selectedDate = dom.fechaVisitaSelect?.value || "";
  const selectedTime = dom.bloqueHorario?.value || "";
  const combinedDateTime = selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : "";

  const payload = {
    doc_id: docId ?? 0,
    Nomb_visitante: String(dom.visitanteInput?.value ?? "").trim(),
    cod_Residente: residentCode ?? 0,
    Fecha_Visita: combinedDateTime, // Envía ej: "2025-10-28 10:00:00"
    cod_usuario: userId ?? 0,
  };

  const visibleCode = toInteger(dom.codigoInput?.value);
  if (visibleCode) {
    payload.cod_Visitas = visibleCode;
  }

  return payload;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (visitasState.isSubmitting) {
    return;
  }

  const errors = validateForm();
  if (errors.length > 0) {
    await notify("warning", errors.join("\n"), "Corrige los datos");
    return;
  }

  const payload = buildVisitPayload();
  const isEditing = Boolean(visitasState.editingId);
  const targetUrl = isEditing
    ? `${VISITAS_API_URL}/${encodeURIComponent(String(visitasState.editingId))}`
    : VISITAS_API_URL;

  setSubmittingState(true);

  try {
    await requestJson(targetUrl, {
      method: isEditing ? "PUT" : "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    await notify("success", isEditing ? "Visita actualizada correctamente." : "Visita registrada correctamente.");
    
    // Disparar alerta silenciosa solo si es registro nuevo
    if (!isEditing) {
      void triggerAdminNotification(payload);
    }

    closeForm();
    await loadVisits();
  } catch (error) {
    console.error("Error al guardar la visita:", error);
    if (error.message !== "Sesion expirada") {
      await notify("error", `No se pudo guardar la visita: ${error.message}`);
    }
  } finally {
    setSubmittingState(false);
    refreshSessionSummary();
  }
}

async function deleteVisit(visit) {
  const confirmed = await confirmAction("¿Seguro que quieres eliminar esta visita?", "Eliminar visita");
  if (!confirmed) {
    return;
  }

  try {
    await requestJson(`${VISITAS_API_URL}/${encodeURIComponent(String(visit.id))}`, {
      method: "DELETE",
      headers: buildHeaders(false),
    });

    await notify("success", "Visita eliminada correctamente.");
    if (String(visitasState.editingId) === String(visit.id)) {
      closeForm();
    }
    await loadVisits();
  } catch (error) {
    console.error("Error al eliminar la visita:", error);
    if (error.message !== "Sesion expirada") {
      await notify("error", `No se pudo eliminar la visita: ${error.message}`);
    }
  }
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function notify(kind, message, title = "") {
  const api = window.HgaAlerts?.[kind];

  if (typeof api === "function") {
    try {
      return await api(message, title);
    } catch {
      // Si el modal falla, usamos el fallback nativo.
    }
  }

  const prefix = title ? `${title}: ` : "";
  if (kind === "error") {
    window.alert(`${prefix}${message}`);
    return false;
  }

  if (kind === "warning") {
    window.alert(`${prefix}${message}`);
    return true;
  }

  window.alert(message);
  return true;
}

async function confirmAction(message, title = "") {
  const api = window.HgaAlerts?.confirm;

  if (typeof api === "function") {
    try {
      return Boolean(await api(message, title));
    } catch {
      // Usamos fallback nativo si el modal no responde.
    }
  }

  return window.confirm(title ? `${title}\n${message}` : message);
}