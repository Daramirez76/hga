const INFORMES_API_URL = `${window.location.origin}/api/informes`;
const RESIDENTES_API_URL = `${window.location.origin}/api/residentes`;
const PROFILE_API_URL = `${window.location.origin}/api/me`;
const LOGIN_URL = "login.html";
const INFORMES_PAGE_SIZE = window.HgaPagination?.DEFAULT_PAGE_SIZE || 5;

const informesState = {
  items: [],
  residents: [],
  currentUser: null,
  pagination: {
    currentPage: 1,
    perPage: INFORMES_PAGE_SIZE,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
    serverPaginated: false,
  },
  paginationHost: null,
  searchQuery: "",
  editingId: null,
  modalInstance: null,
  isSubmitting: false,
};

const dom = {
  searchInput: null,
  clearFilterButton: null,
  listContainer: null,
  newButton: null,
  banner: null,
  context: null,
  informesBadge: null,
  residentesBadge: null,
  form: null,
  modal: null,
  modalTitle: null,
  modalSubtitle: null,
  codigoInput: null,
  residenteSelect: null,
  tituloInput: null,
  tipoSelect: null,
  urgenciaSelect: null,
  descripcionInput: null,
  autorInput: null,
  saveButton: null,
};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  setManagementVisibility(false);
  wireEvents();
  bootstrapInformes();
});

function cacheDom() {
  dom.searchInput = document.getElementById("searchInformes");
  dom.clearFilterButton = document.getElementById("btnLimpiarFiltro");
  dom.listContainer = document.getElementById("listaInformesContainer");
  dom.newButton = document.getElementById("btnNuevoInforme");
  dom.banner = document.getElementById("informesBanner");
  dom.context = document.getElementById("informesContext");
  dom.informesBadge = document.getElementById("informesCountBadge");
  dom.residentesBadge = document.getElementById("residentesCountBadge");
  dom.form = document.getElementById("formInforme");
  dom.modal = document.getElementById("modalInforme");
  dom.modalTitle = document.getElementById("modalInformeTitle");
  dom.modalSubtitle = document.getElementById("modalInformeSubtitle");
  dom.codigoInput = document.getElementById("inputInformeCodigo");
  dom.residenteSelect = document.getElementById("inputInformeResidente");
  dom.tituloInput = document.getElementById("inputInformeTitulo");
  dom.tipoSelect = document.getElementById("inputInformeTipo");
  dom.urgenciaSelect = document.getElementById("inputInformeUrgencia");
  dom.descripcionInput = document.getElementById("inputInformeDescripcion");
  dom.autorInput = document.getElementById("inputInformeAutor");
  dom.saveButton = document.getElementById("btnGuardarInforme");
}

function wireEvents() {
  if (dom.searchInput instanceof HTMLInputElement) {
    dom.searchInput.addEventListener("input", filtrarInformes);
  }

  if (dom.clearFilterButton instanceof HTMLButtonElement) {
    dom.clearFilterButton.addEventListener("click", () => {
      if (dom.searchInput) {
        dom.searchInput.value = "";
      }
      informesState.searchQuery = "";
      void loadInformes(1, { force: true });
    });
  }

  if (dom.newButton instanceof HTMLButtonElement) {
    dom.newButton.addEventListener("click", () => openCreateModal());
  }

  if (dom.listContainer instanceof HTMLElement) {
    dom.listContainer.addEventListener("click", handleListClick);
  }

  if (dom.form instanceof HTMLFormElement) {
    dom.form.addEventListener("submit", handleFormSubmit);
  }

  if (dom.modal instanceof HTMLElement) {
    dom.modal.addEventListener("hidden.bs.modal", resetModalState);
  }
}

function setManagementVisibility(isVisible) {
  if (dom.newButton instanceof HTMLButtonElement) {
    dom.newButton.hidden = !isVisible;
  }
}

async function bootstrapInformes() {
  if (!getStoredToken()) {
    window.location.href = LOGIN_URL;
    return;
  }

  showBanner("Cargando informes y datos de sesión...", "info");

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
    }

    await loadInformes();
    updateContext();
    setManagementVisibility(true);

    if (residentResult.status === "rejected") {
      showBanner("No fue posible cargar la lista de residentes. El resto del modulo sigue disponible.", "warning");
    }
  } catch (error) {
    console.error("Error al iniciar el modulo de informes:", error);
    showBanner(`No fue posible preparar el modulo: ${error.message}`, "danger");
    renderInformes();
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
    console.warn("No fue posible sincronizar el usuario en localStorage:", error);
  }
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

function toInteger(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
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
    throw new Error(data.message || `Error HTTP ${response.status}`);
  }

  return data;
}

function normalizeCurrentUser(payload) {
  const user = payload?.user || payload?.data || payload || {};
  const firstName = String(user.nombre || "").trim();
  const lastName = String(user.apellido || "").trim();
  const nameFromApi = String(user.name || "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim()
    || nameFromApi
    || String(user.username || user.email || "").trim()
    || `Usuario #${user.id || "sin id"}`;

  return {
    id: Number.parseInt(String(user.id ?? 0), 10) || 0,
    docId: String(user.doc_id ?? user.docId ?? "").trim(),
    displayName,
    email: String(user.email || "").trim(),
    roleCode: Number.parseInt(String(user.cod_rol ?? user.role_code ?? 0), 10) || 0,
  };
}

function normalizeResident(item) {
  const source = item || {};
  const code = toInteger(source.cod_residente ?? source.id);
  const label = [source.nombre, source.apellido].map((value) => String(value ?? "").trim()).filter(Boolean).join(" ");

  return {
    code: code ?? 0,
    label: label || (code ? `Residente ${code}` : "Residente"),
  };
}

function normalizeInforme(item) {
  const source = item || {};
  const idValue = source.cod_Informes ?? source.cod_informes ?? source.id ?? "";
  const id = toInteger(idValue);
  const codResidente = toInteger(source.cod_Residente ?? source.cod_residente ?? source.resident_id);

  return {
    raw: source,
    id: id ?? String(idValue),
    codeLabel: String(idValue || id || "").trim(),
    codResidente: codResidente ?? 0,
    titulo: String(source.Titulo_Informes ?? source.titulo ?? "").trim(),
    descripcion: String(source.descripcion ?? source.description ?? "").trim(),
    tipo: String(source.tipo ?? "general").trim() || "general",
    urgencia: String(source.urgencia ?? "normal").trim() || "normal",
    docId: String(source.doc_id ?? "").trim(),
    roleCode: toInteger(source.cod_rol ?? source.role_code) ?? 0,
    residentLabel: "",
  };
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

function findResidentLabel(code) {
  const resident = informesState.residents.find((item) => String(item.code) === String(code));
  return resident ? resident.label : (code ? `Residente ${code}` : "Sin residente");
}

function enrichInforme(informe) {
  return {
    ...informe,
    residentLabel: findResidentLabel(informe.codResidente),
  };
}

function findInformeById(id) {
  return informesState.items.find((item) => String(item.id) === String(id));
}

function updateContext() {
  if (dom.context instanceof HTMLElement) {
    const userLabel = informesState.currentUser?.displayName || "usuario no disponible";
    const residentCount = informesState.residents.length;
    dom.context.textContent = `Sesión activa: ${userLabel}. Residentes cargados: ${residentCount}.`;
  }

  if (dom.informesBadge instanceof HTMLElement) {
    const totalInformes = informesState.pagination.total > 0 ? informesState.pagination.total : informesState.items.length;
    dom.informesBadge.textContent = `${totalInformes} ${totalInformes === 1 ? "informe" : "informes"}`;
  }

  if (dom.residentesBadge instanceof HTMLElement) {
    dom.residentesBadge.textContent = `${informesState.residents.length} ${informesState.residents.length === 1 ? "residente" : "residentes"}`;
  }

  if (dom.autorInput instanceof HTMLInputElement) {
    dom.autorInput.value = informesState.currentUser?.displayName || "Usuario no disponible";
  }
}

function showBanner(message, variant = "info") {
  if (!(dom.banner instanceof HTMLElement)) {
    return;
  }

  if (!message) {
    dom.banner.className = "informes-banner alert d-none mb-3";
    dom.banner.textContent = "";
    return;
  }

  dom.banner.className = `informes-banner alert alert-${variant} mb-3`;
  dom.banner.textContent = message;
}

function renderResidentOptions(selectedValue = "") {
  if (!(dom.residenteSelect instanceof HTMLSelectElement)) {
    return;
  }

  dom.residenteSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = informesState.residents.length > 0 ? "Selecciona un residente" : "No hay residentes disponibles";
  dom.residenteSelect.appendChild(placeholder);

  informesState.residents.forEach((resident) => {
    const option = document.createElement("option");
    option.value = String(resident.code);
    option.textContent = resident.label;
    if (String(selectedValue) === String(resident.code)) {
      option.selected = true;
    }
    dom.residenteSelect.appendChild(option);
  });
}

function getSearchTerm() {
  return dom.searchInput instanceof HTMLInputElement ? dom.searchInput.value.trim() : "";
}

function getPaginationHost() {
  if (informesState.paginationHost instanceof HTMLElement) {
    return informesState.paginationHost;
  }

  const container = dom.listContainer;
  if (!(container instanceof HTMLElement)) {
    return null;
  }

  informesState.paginationHost = window.HgaPagination?.ensureHost
    ? window.HgaPagination.ensureHost(container, "informesPagination")
    : null;

  return informesState.paginationHost;
}

function renderInformesPagination() {
  const host = getPaginationHost();

  if (!(host instanceof HTMLElement) || !window.HgaPagination) {
    return;
  }

  window.HgaPagination.renderControls(host, informesState.pagination, (page) => {
    void loadInformes(page, { force: true });
  }, {
    itemLabel: "informes",
    ariaLabel: "Paginación de informes",
  });
}

function renderInformeCard(informe) {
  const card = document.createElement("article");
  card.className = "informe-card";
  card.dataset.informeId = String(informe.id);

  card.innerHTML = `
    <div class="informe-card-header">
      <div>
        <div class="informe-code">Informe #${escapeHtml(informe.codeLabel || informe.id)}</div>
        <h6 class="informe-title">${escapeHtml(informe.titulo || "Sin título")}</h6>
      </div>
      <div class="text-end">
        <div class="small text-muted">${escapeHtml(informe.residentLabel)}</div>
      </div>
    </div>
    <div class="informe-meta">
      <span class="informe-chip">${escapeHtml(informe.residentLabel)}</span>
      <span class="informe-chip type">${escapeHtml((informe.tipo || "general").toUpperCase())}</span>
      <span class="informe-chip urgency-${escapeHtml(informe.urgencia || "normal")}">${escapeHtml((informe.urgencia || "normal").toUpperCase())}</span>
    </div>
    <p class="informe-description">${escapeHtml(informe.descripcion || "Sin descripción")}</p>
    <div class="informe-actions">
      <button type="button" class="btn btn-sm btn-info" data-action="edit">Editar</button>
      <button type="button" class="btn btn-sm btn-danger" data-action="delete">Eliminar</button>
    </div>
  `;

  return card;
}

function renderInformes() {
  if (!(dom.listContainer instanceof HTMLElement)) {
    return;
  }

  dom.listContainer.innerHTML = "";

  if (informesState.items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state-informes";
    empty.textContent = informesState.searchQuery
      ? "No hay resultados para ese filtro."
      : "Aún no hay informes cargados.";
    dom.listContainer.appendChild(empty);
    renderInformesPagination();
    return;
  }

  informesState.items.forEach((item) => {
    dom.listContainer.appendChild(renderInformeCard(item));
  });

  renderInformesPagination();
}

function handleListClick(event) {
  const button = event.target instanceof HTMLElement ? event.target.closest("[data-action]") : null;
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const card = button.closest("[data-informe-id]");
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const informe = findInformeById(card.dataset.informeId);
  if (!informe) {
    return;
  }

  const action = button.dataset.action;
  if (action === "edit") {
    openEditModal(informe);
  }

  if (action === "delete") {
    void deleteInforme(informe);
  }
}

async function loadCurrentUser() {
  const payload = await requestJson(PROFILE_API_URL, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const userData = payload.user || payload.data || payload;
  informesState.currentUser = normalizeCurrentUser(userData);
  syncStoredUser(userData);
  updateContext();
}

async function loadResidents() {
  const payload = await requestJson(RESIDENTES_API_URL, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const collection = normalizeCollection(payload);
  informesState.residents = collection.map(normalizeResident).filter((item) => item.code);
  renderResidentOptions();
  updateContext();
}

async function loadInformes(page = informesState.pagination.currentPage || 1, options = {}) {
  const url = window.HgaPagination?.buildUrl
    ? window.HgaPagination.buildUrl(INFORMES_API_URL, {
        page,
        per_page: INFORMES_PAGE_SIZE,
        search: informesState.searchQuery,
      })
    : `${INFORMES_API_URL}?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(INFORMES_PAGE_SIZE))}&search=${encodeURIComponent(informesState.searchQuery)}`;

  const payload = await requestJson(url, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const normalized = window.HgaPagination?.normalizeResponse
    ? window.HgaPagination.normalizeResponse(payload, {
        page,
        perPage: INFORMES_PAGE_SIZE,
      })
    : {
        items: normalizeCollection(payload),
        meta: {
          currentPage: page,
          perPage: INFORMES_PAGE_SIZE,
          total: normalizeCollection(payload).length,
          lastPage: 1,
          from: 0,
          to: 0,
          serverPaginated: false,
        },
      };

  informesState.pagination = normalized.meta;
  const collection = normalized.items.map(normalizeInforme).map(enrichInforme);
  informesState.items = normalized.meta.serverPaginated
    ? collection.slice()
    : (window.HgaPagination?.slicePage
      ? window.HgaPagination.slicePage(collection, normalized.meta.currentPage, normalized.meta.perPage)
      : collection.slice((normalized.meta.currentPage - 1) * normalized.meta.perPage, normalized.meta.currentPage * normalized.meta.perPage));
  renderInformes();
  updateContext();
  showBanner("");
}

function filtrarInformes() {
  const query = getSearchTerm().toLowerCase();
  informesState.searchQuery = query;

  if (!query) {
    // Sin filtro: recarga normal desde el servidor
    void loadInformes(1, { force: true });
    return;
  }

  // Filtro local sobre todos los items cargados
  const todosLosItems = informesState._allItems || informesState.items;

  const filtrados = todosLosItems.filter((informe) => {
    const titulo      = (informe.titulo || "").toLowerCase();
    const descripcion = (informe.descripcion || "").toLowerCase();
    const urgencia    = (informe.urgencia || "").toLowerCase();
    const tipo        = (informe.tipo || "").toLowerCase();
    const residente   = (informe.residentLabel || "").toLowerCase();
    const codigo      = String(informe.codeLabel || informe.id || "").toLowerCase();

    return (
      titulo.includes(query)      ||
      descripcion.includes(query) ||
      urgencia.includes(query)    ||
      tipo.includes(query)        ||
      residente.includes(query)   ||
      codigo.includes(query)
    );
  });

  informesState.items = filtrados;
  renderInformes();
}

function getModalInstance() {
  if (!(dom.modal instanceof HTMLElement) || typeof bootstrap === "undefined") {
    return null;
  }

  if (!informesState.modalInstance) {
    informesState.modalInstance = bootstrap.Modal.getOrCreateInstance(dom.modal);
  }

  return informesState.modalInstance;
}

function setModalDefaults() {
  if (!(dom.form instanceof HTMLFormElement)) {
    return;
  }

  dom.form.reset();

  if (dom.codigoInput instanceof HTMLInputElement) {
    dom.codigoInput.value = "Lo asigna el sistema";
  }

  if (dom.tipoSelect instanceof HTMLSelectElement) {
    dom.tipoSelect.value = "general";
  }

  if (dom.urgenciaSelect instanceof HTMLSelectElement) {
    dom.urgenciaSelect.value = "normal";
  }

  if (dom.autorInput instanceof HTMLInputElement) {
    dom.autorInput.value = informesState.currentUser?.displayName || "Usuario no disponible";
  }
}

function openCreateModal() {
  informesState.editingId = null;
  setModalDefaults();
  renderResidentOptions();

  if (dom.modalTitle instanceof HTMLElement) {
    dom.modalTitle.textContent = "Nuevo informe";
  }

  if (dom.modalSubtitle instanceof HTMLElement) {
    dom.modalSubtitle.textContent = "Usa el residente real y deja que el sistema asigne el identificador.";
  }

  if (dom.saveButton instanceof HTMLButtonElement) {
    dom.saveButton.textContent = "Guardar";
  }

  getModalInstance()?.show();
}

function openEditModal(informe) {
  informesState.editingId = informe.id;
  setModalDefaults();
  renderResidentOptions(informe.codResidente);

  if (dom.codigoInput instanceof HTMLInputElement) {
    dom.codigoInput.value = informe.codeLabel || String(informe.id);
  }

  if (dom.tituloInput instanceof HTMLInputElement) {
    dom.tituloInput.value = informe.titulo || "";
  }

  if (dom.tipoSelect instanceof HTMLSelectElement) {
    dom.tipoSelect.value = informe.tipo || "general";
  }

  if (dom.urgenciaSelect instanceof HTMLSelectElement) {
    dom.urgenciaSelect.value = informe.urgencia || "normal";
  }

  if (dom.descripcionInput instanceof HTMLTextAreaElement) {
    dom.descripcionInput.value = informe.descripcion || "";
  }

  if (dom.modalTitle instanceof HTMLElement) {
    dom.modalTitle.textContent = `Editar informe #${informe.codeLabel || informe.id}`;
  }

  if (dom.modalSubtitle instanceof HTMLElement) {
    dom.modalSubtitle.textContent = "Solo se actualizan los campos editables del recurso.";
  }

  if (dom.saveButton instanceof HTMLButtonElement) {
    dom.saveButton.textContent = "Actualizar";
  }

  getModalInstance()?.show();
}

function resetModalState() {
  informesState.editingId = null;
  informesState.isSubmitting = false;

  if (dom.saveButton instanceof HTMLButtonElement) {
    dom.saveButton.disabled = false;
    dom.saveButton.textContent = "Guardar";
  }

  if (dom.form instanceof HTMLFormElement) {
    dom.form.reset();
  }

  if (dom.codigoInput instanceof HTMLInputElement) {
    dom.codigoInput.value = "Lo asigna el sistema";
  }

  if (dom.autorInput instanceof HTMLInputElement) {
    dom.autorInput.value = informesState.currentUser?.displayName || "Usuario no disponible";
  }

  showBanner("");
}

function readFormPayload() {
  const residentId = dom.residenteSelect instanceof HTMLSelectElement ? toInteger(dom.residenteSelect.value) : null;
  const title = dom.tituloInput instanceof HTMLInputElement ? dom.tituloInput.value.trim() : "";
  const description = dom.descripcionInput instanceof HTMLTextAreaElement ? dom.descripcionInput.value.trim() : "";
  const type = dom.tipoSelect instanceof HTMLSelectElement ? dom.tipoSelect.value.trim() : "general";
  const urgency = dom.urgenciaSelect instanceof HTMLSelectElement ? dom.urgenciaSelect.value.trim() : "normal";

  return {
    residentId,
    title,
    description,
    type: type || "general",
    urgency: urgency || "normal",
  };
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (informesState.isSubmitting) {
    return;
  }

  const payload = readFormPayload();

  if (!payload.residentId || !payload.title) {
    if (window.HgaAlerts?.warning) {
      await window.HgaAlerts.warning("Selecciona un residente y escribe un título.", "Formulario incompleto");
    }
    return;
  }

  informesState.isSubmitting = true;

  if (dom.saveButton instanceof HTMLButtonElement) {
    dom.saveButton.disabled = true;
    dom.saveButton.textContent = informesState.editingId ? "Actualizando..." : "Guardando...";
  }

  const requestBody = {
    cod_Residente: payload.residentId,
    Titulo_Informes: payload.title,
    descripcion: payload.description,
    tipo: payload.type,
    urgencia: payload.urgency,
  };

  try {
    const isEditing = informesState.editingId !== null && informesState.editingId !== undefined;
    const url = isEditing ? `${INFORMES_API_URL}/${informesState.editingId}` : INFORMES_API_URL;
    const method = isEditing ? "PUT" : "POST";

    await requestJson(url, {
      method,
      headers: buildHeaders(true),
      body: JSON.stringify(requestBody),
    });

    if (window.HgaAlerts?.success) {
    await window.HgaAlerts.success(isEditing ? "Informe actualizado" : "Informe creado");
    }

    getModalInstance()?.hide();
    await loadInformes(informesState.pagination.currentPage || 1, { force: true });
    showBanner(isEditing ? "Informe actualizado correctamente." : "Informe creado correctamente.", "success");
  } catch (error) {
    console.error("Error al guardar informe:", error);
    if (window.HgaAlerts?.error) {
      await window.HgaAlerts.error(`No se pudo guardar el informe: ${error.message}`);
    }
  } finally {
    informesState.isSubmitting = false;
    if (dom.saveButton instanceof HTMLButtonElement) {
      dom.saveButton.disabled = false;
      dom.saveButton.textContent = informesState.editingId ? "Actualizar" : "Guardar";
    }
  }
}

async function deleteInforme(informe) {
  if (!window.HgaAlerts?.confirm) {
    if (!window.confirm("¿Seguro deseas eliminar el informe?")) {
      return;
    }
  } else if (!(await window.HgaAlerts.confirm("¿Seguro deseas eliminar el informe?", "Eliminar informe"))) {
    return;
  }

  try {
    await requestJson(`${INFORMES_API_URL}/${informe.id}`, {
      method: "DELETE",
      headers: buildHeaders(false),
    });

    if (window.HgaAlerts?.success) {
      await window.HgaAlerts.success("Informe eliminado");
    }

    await loadInformes(informesState.pagination.currentPage || 1, { force: true });
    showBanner("Informe eliminado correctamente.", "success");
  } catch (error) {
    console.error("Error al eliminar informe:", error);
    if (window.HgaAlerts?.error) {
      await window.HgaAlerts.error(`No se pudo eliminar el informe: ${error.message}`);
    }
  }
}

function applyStoredUserFallback() {
  const storedUser = readStoredUser();
  if (!storedUser) {
    return;
  }

  informesState.currentUser = normalizeCurrentUser(storedUser);
  updateContext();
}
