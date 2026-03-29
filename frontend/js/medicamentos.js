const MEDICAMENTOS_API_BASE = `${window.location.origin}/api/medicamentos`;
const RESIDENTES_API_BASE = `${window.location.origin}/api/residentes`;
const PROFILE_API_ENDPOINT = `${window.location.origin}/api/me`;
const MEDICATION_EMPTY_STATE = '<div class="empty-state">No hay medicamentos registrados.</div>';
const NOVELTY_EMPTY_STATE = '<div class="empty-state">Sin novedades registradas.</div>';
const MEDICATION_PAGE_SIZE = window.HgaPagination?.DEFAULT_PAGE_SIZE || 5;

const medicationState = {
  items: [],
  allItems: [],
  residents: [],
  editingId: "",
  currentUser: null,
  isSubmitting: false,
  residentLoadError: "",
  pagination: {
    currentPage: 1,
    perPage: MEDICATION_PAGE_SIZE,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
    serverPaginated: false,
  },
  paginationHost: null,
};

document.addEventListener("DOMContentLoaded", () => {
  const medicationForm = document.getElementById("medicationForm");
  const medicationList = document.getElementById("medicationList");
  const noveltyList = document.getElementById("noveltyList");
  const cancelButton = document.getElementById("medicationCancelButton");

  if (medicationForm instanceof HTMLFormElement) {
    medicationForm.addEventListener("submit", handleMedicationSubmit);
  }

  if (medicationList instanceof HTMLElement) {
    medicationList.addEventListener("click", handleMedicationListClick);
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener("click", resetMedicationForm);
  }

  if (noveltyList instanceof HTMLElement) {
    noveltyList.innerHTML = NOVELTY_EMPTY_STATE;
  }

  void bootstrapMedicationModule();
});

function getMedicationPaginationHost() {
  if (medicationState.paginationHost instanceof HTMLElement) {
    return medicationState.paginationHost;
  }

  const medicationList = document.getElementById("medicationList");
  if (!(medicationList instanceof HTMLElement)) {
    return null;
  }

  medicationState.paginationHost = window.HgaPagination?.ensureHost
    ? window.HgaPagination.ensureHost(medicationList, "medicationPagination")
    : null;

  return medicationState.paginationHost;
}

async function bootstrapMedicationModule() {
  if (!getStoredToken()) {
    window.location.href = "login.html";
    return;
  }

  try {
    const [userResult, residentResult] = await Promise.allSettled([cargarUsuarioActual(), cargarResidentes()]);

    if (userResult.status === "rejected") {
      console.warn("No fue posible cargar /api/me:", userResult.reason);
      applyStoredUserFallback();
    }

    if (residentResult.status === "rejected") {
      console.warn("No fue posible cargar /api/residentes:", residentResult.reason);
      handleResidentLoadFailure(residentResult.reason);
    }

    initializeMedicationFormDefaults();
    await cargarMedicamentos();
  } catch (error) {
    console.error("Error al iniciar el modulo de medicamentos:", error);
    mostrarError(`No fue posible preparar el modulo: ${error.message}`);
    renderMedicationErrorState();
  }
}

function getStoredToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearStoredSession();
    window.location.href = "login.html";
    throw new Error("Sesion expirada");
  }

  if (!response.ok) {
    throw new Error(data.message || `Error HTTP ${response.status}`);
  }

  return data;
}

async function cargarUsuarioActual() {
  try {
    const payload = await fetchJson(PROFILE_API_ENDPOINT, {
      method: "GET",
      headers: buildHeaders(false),
    });

    medicationState.currentUser = normalizeCurrentUser(payload.user || {});
    syncStoredUser(payload.user || {});
  } catch (error) {
    if (error.message === "Sesion expirada") {
      throw error;
    }

    applyStoredUserFallback();
    throw error;
  }
}

async function cargarResidentes() {
  try {
    const payload = await fetchJson(RESIDENTES_API_BASE, {
      method: "GET",
      headers: buildHeaders(false),
    });

    const collection = Array.isArray(payload.data) ? payload.data : [];
    medicationState.residents = collection.map(normalizeResident);
    medicationState.residentLoadError = "";
    populateResidentOptions();
  } catch (error) {
    if (error.message === "Sesion expirada") {
      throw error;
    }

    handleResidentLoadFailure(error);
    throw error;
  }
}

async function cargarMedicamentos(page = medicationState.pagination.currentPage || 1, options = {}) {
  const url = window.HgaPagination?.buildUrl
    ? window.HgaPagination.buildUrl(MEDICAMENTOS_API_BASE, {
        page,
        per_page: MEDICATION_PAGE_SIZE,
      })
    : `${MEDICAMENTOS_API_BASE}?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(MEDICATION_PAGE_SIZE))}`;

  const payload = await fetchJson(url, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const normalized = window.HgaPagination?.normalizeResponse
    ? window.HgaPagination.normalizeResponse(payload, {
        page,
        perPage: MEDICATION_PAGE_SIZE,
      })
      : {
        items: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
        meta: {
          currentPage: page,
          perPage: MEDICATION_PAGE_SIZE,
          total: Array.isArray(payload?.data) ? payload.data.length : Array.isArray(payload) ? payload.length : 0,
          lastPage: 1,
          from: 0,
          to: 0,
          serverPaginated: false,
        },
      };

  const collection = normalized.items.map(normalizeMedication);
  medicationState.pagination = normalized.meta;
  medicationState.allItems = collection;
  medicationState.items = normalized.meta.serverPaginated
    ? collection.slice()
    : (window.HgaPagination?.slicePage
      ? window.HgaPagination.slicePage(collection, normalized.meta.currentPage, normalized.meta.perPage)
      : collection.slice((normalized.meta.currentPage - 1) * normalized.meta.perPage, normalized.meta.currentPage * normalized.meta.perPage));
  renderMedicationList();
  renderNoveltyList();
}

function normalizeMedication(item) {
  const normalized = item || {};
  const id = normalized.Cod_medicamento ?? normalized.cod_medicamento ?? normalized.id ?? "";
  const name = String(normalized.nombre_medic || "").trim();
  const stock = Number(normalized.stock ?? 0);
  const description = String(normalized.descrip_novedad || "").trim();
  const entryDate = String(normalized.fecha_entrada || "").trim();
  const expiryDate = String(normalized.fecha_vencimiento || "").trim();
  const noveltyDate = String(normalized.fecha_novedad || "").trim();
  const userCode = Number(normalized.cod_usuario ?? 0);
  const residentCode = Number(normalized.cod_residente ?? 0);
  const roleCode = Number(normalized.cod_rol ?? 0);

  return {
    raw: normalized,
    id: String(id),
    name,
    stock: Number.isFinite(stock) ? stock : 0,
    description,
    entryDate,
    expiryDate,
    noveltyDate,
    userCode: Number.isFinite(userCode) ? userCode : 0,
    residentCode: Number.isFinite(residentCode) ? residentCode : 0,
    roleCode: Number.isFinite(roleCode) ? roleCode : 0,
  };
}

function normalizeResident(item) {
  const normalized = item || {};
  const code = Number(normalized.cod_residente ?? normalized.id ?? 0);
  const name = String(normalized.nombre || "").trim();
  const lastName = String(normalized.apellido || "").trim();
  const label = [name, lastName].filter(Boolean).join(" ").trim() || `Residente ${code}`;

  return {
    code: Number.isFinite(code) ? code : 0,
    label,
  };
}

function normalizeCurrentUser(user) {
  const normalized = user || {};
  const id = Number(normalized.id ?? 0);
  const docId = String(normalized.doc_id ?? "").trim();
  const fullName = [normalized.name, normalized.apellido].filter(Boolean).join(" ").trim();
  const displayName = fullName || normalized.username || normalized.email || `Usuario #${id || "sin id"}`;

  return {
    id: Number.isFinite(id) ? id : 0,
    docId,
    displayName,
  };
}

function syncStoredUser(user) {
  try {
    const storedUser = readStoredUser() || {};
    const mergedUser = {
      ...storedUser,
      ...user,
      id: user.id ?? storedUser.id ?? "",
    };

    localStorage.setItem("usuario", JSON.stringify(mergedUser));
  } catch (error) {
    console.warn("No fue posible sincronizar el usuario en localStorage:", error);
  }
}

function initializeMedicationFormDefaults() {
  const entryDateInput = document.getElementById("medicationEntryDate");
  const userCodeInput = document.getElementById("medicationUserCode");
  const userDisplayInput = document.getElementById("medicationUserDisplay");
  const noveltyDateInput = document.getElementById("medicationNoveltyDate");

  const today = toDateInputValue(new Date());

  if (entryDateInput instanceof HTMLInputElement && !entryDateInput.value) {
    entryDateInput.value = today;
  }

  if (noveltyDateInput instanceof HTMLInputElement && medicationState.editingId === "") {
    noveltyDateInput.value = "";
  }

  setMedicationUserField(
    medicationState.currentUser?.id || 0,
    medicationState.currentUser?.displayName || "Usuario no disponible"
  );

  if (userCodeInput instanceof HTMLInputElement && !userCodeInput.value && medicationState.currentUser?.id) {
    userCodeInput.value = String(medicationState.currentUser.id);
  }

  if (userDisplayInput instanceof HTMLInputElement && !userDisplayInput.value) {
    userDisplayInput.value = buildUserDisplayLabel(
      medicationState.currentUser?.displayName || "Usuario no disponible",
      medicationState.currentUser?.docId || ""
    );
  }

  populateResidentOptions(
    medicationState.editingId ? String(getSelectedResidentCode()) : "",
    { preserveStatus: true }
  );
}

function setMedicationUserField(userCode, label, docId = "") {
  const userCodeInput = document.getElementById("medicationUserCode");
  const userDisplayInput = document.getElementById("medicationUserDisplay");

  if (userCodeInput instanceof HTMLInputElement) {
    userCodeInput.value = userCode > 0 ? String(userCode) : "";
  }

  if (userDisplayInput instanceof HTMLInputElement) {
    userDisplayInput.value = buildUserDisplayLabel(label, docId);
  }
}

function buildUserDisplayLabel(label, docId) {
  if (!label && !docId) {
    return "";
  }

  if (!docId) {
    return String(label || "").trim();
  }

  return `${String(label || "").trim()} (${docId})`;
}

function populateResidentOptions(selectedValue = "", options = {}) {
  const residentSelect = document.getElementById("medicationResidentCode");

  if (!(residentSelect instanceof HTMLSelectElement)) {
    return;
  }

  const { preserveStatus = false } = options;
  const normalizedSelection = String(selectedValue || "");
  const residents = [...medicationState.residents].sort((left, right) =>
    left.label.localeCompare(right.label, "es", { sensitivity: "base" })
  );

  let markup = '<option value="">Selecciona un residente</option>';

  if (residents.length === 0) {
    markup = '<option value="">No hay residentes disponibles</option>';
  }

  for (const resident of residents) {
    markup += `<option value="${escapeHtml(String(resident.code))}">${escapeHtml(
      `${resident.label} (#${resident.code})`
    )}</option>`;
  }

  if (normalizedSelection && !residents.some((resident) => String(resident.code) === normalizedSelection)) {
    markup += `<option value="${escapeHtml(normalizedSelection)}">Residente #${escapeHtml(
      normalizedSelection
    )} (no disponible)</option>`;
  }

  residentSelect.innerHTML = markup;
  residentSelect.value = normalizedSelection;
  residentSelect.disabled = residents.length === 0 && !normalizedSelection;

  if (!preserveStatus) {
    if (residents.length === 0) {
      updateResidentStatus("No hay residentes disponibles en este momento.", "warn");
    } else {
      updateResidentStatus();
    }
  }
}

function renderMedicationErrorState() {
  const medicationList = document.getElementById("medicationList");
  const noveltyList = document.getElementById("noveltyList");

  if (medicationList instanceof HTMLElement) {
    medicationList.innerHTML = '<div class="empty-state">No fue posible cargar la lista.</div>';
  }

  if (noveltyList instanceof HTMLElement) {
    noveltyList.innerHTML = '<div class="empty-state">No fue posible cargar las novedades.</div>';
  }
}

function updateResidentStatus(message = "", kind = "") {
  const residentStatus = document.getElementById("medicationResidentStatus");

  if (!(residentStatus instanceof HTMLElement)) {
    return;
  }

  residentStatus.textContent = message;
  residentStatus.classList.remove("warn", "error");

  if (kind === "warn" || kind === "error") {
    residentStatus.classList.add(kind);
  }
}

function handleResidentLoadFailure(error) {
  const hadResidents = medicationState.residents.length > 0;
  medicationState.residentLoadError = error?.message || "No fue posible cargar residentes.";
  updateResidentStatus(
    hadResidents
      ? "No pudimos actualizar la lista de residentes. Se mantiene la ultima carga disponible."
      : "No pudimos cargar residentes. La lista de medicamentos sigue disponible, pero no se pueden registrar nuevos movimientos sin residentes.",
    "warn"
  );
  populateResidentOptions(getSelectedResidentCode(), { preserveStatus: true });
}

function applyStoredUserFallback() {
  const storedUser = readStoredUser();

  if (storedUser) {
    medicationState.currentUser = normalizeCurrentUser(storedUser);
  }

  setMedicationUserField(
    medicationState.currentUser?.id || 0,
    medicationState.currentUser?.displayName || "Usuario no disponible",
    medicationState.currentUser?.docId || ""
  );
}

function getSelectedResidentCode() {
  const residentSelect = document.getElementById("medicationResidentCode");

  if (residentSelect instanceof HTMLSelectElement) {
    return residentSelect.value;
  }

  return "";
}

function renderMedicationList() {
  const container = document.getElementById("medicationList");

  if (!(container instanceof HTMLElement)) {
    return;
  }

  if (medicationState.items.length === 0) {
    container.innerHTML = MEDICATION_EMPTY_STATE;
    return;
  }

  const sortedItems = [...medicationState.items].sort((left, right) =>
    left.name.localeCompare(right.name, "es", { sensitivity: "base" })
  );

  container.innerHTML = sortedItems
    .map((item) => {
      const stockLabel = `${item.stock} unid`;

      return `
        <div class="medication-row">
          <span class="medication-name">${escapeHtml(item.name || "Sin nombre")}</span>
          <span class="medication-stock">${escapeHtml(stockLabel)}</span>
          <div class="medication-actions">
            <button class="medication-action edit" type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Editar</button>
            <button class="medication-action delete" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">Eliminar</button>
          </div>
        </div>
      `;
    })
    .join("");

  renderMedicationPagination();
}

function renderNoveltyList() {
  const container = document.getElementById("noveltyList");

  if (!(container instanceof HTMLElement)) {
    return;
  }

  const noveltyItems = [...medicationState.allItems.length > 0 ? medicationState.allItems : medicationState.items]
    .filter((item) => item.description || item.noveltyDate || item.entryDate)
    .sort((left, right) => {
      const leftDate = parseDate(left.noveltyDate || left.entryDate || left.expiryDate);
      const rightDate = parseDate(right.noveltyDate || right.entryDate || right.expiryDate);
      return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    })
    .slice(0, 3);

  if (noveltyItems.length === 0) {
    container.innerHTML = NOVELTY_EMPTY_STATE;
    return;
  }

  container.innerHTML = noveltyItems
    .map((item) => {
      const title = item.description || `${item.name} actualizado`;
      const dateValue = item.noveltyDate || item.entryDate || item.expiryDate;

      return `
        <article class="novelty-card">
          <p class="novelty-title">${escapeHtml(title)}</p>
          <p class="novelty-meta">${escapeHtml(formatRelativeDate(dateValue))}</p>
        </article>
      `;
    })
    .join("");
}

function renderMedicationPagination() {
  const host = getMedicationPaginationHost();

  if (!(host instanceof HTMLElement) || !window.HgaPagination) {
    return;
  }

  window.HgaPagination.renderControls(host, medicationState.pagination, (page) => {
    void cargarMedicamentos(page, { force: true });
  }, {
    itemLabel: "medicamentos",
    ariaLabel: "Paginación de medicamentos",
  });
}

function handleMedicationListClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const actionButton = target.closest("[data-action]");
  if (!(actionButton instanceof HTMLButtonElement)) {
    return;
  }

  const medicationId = String(actionButton.dataset.id || "");
  const action = String(actionButton.dataset.action || "");

  if (action === "edit") {
    cargarFormularioEdicion(medicationId);
    return;
  }

  if (action === "delete") {
    void eliminarMedicamento(medicationId);
  }
}

function cargarFormularioEdicion(id) {
  const selected = medicationState.items.find((item) => item.id === id);

  if (!selected) {
    mostrarError("No fue posible cargar el medicamento para editar.");
    return;
  }

  const nameInput = document.getElementById("medicationName");
  const stockInput = document.getElementById("medicationStock");
  const entryDateInput = document.getElementById("medicationEntryDate");
  const expiryDateInput = document.getElementById("medicationExpiryDate");
  const residentCodeInput = document.getElementById("medicationResidentCode");
  const noveltyDateInput = document.getElementById("medicationNoveltyDate");
  const descriptionInput = document.getElementById("medicationDescription");
  const editingIdInput = document.getElementById("medicationEditingId");
  const submitButton = document.getElementById("medicationSubmitButton");
  const cancelButton = document.getElementById("medicationCancelButton");

  if (nameInput instanceof HTMLInputElement) {
    nameInput.value = selected.name;
  }

  if (stockInput instanceof HTMLInputElement) {
    stockInput.value = String(selected.stock);
  }

  if (entryDateInput instanceof HTMLInputElement) {
    entryDateInput.value = selected.entryDate;
  }

  if (expiryDateInput instanceof HTMLInputElement) {
    expiryDateInput.value = selected.expiryDate;
  }

  if (residentCodeInput instanceof HTMLSelectElement) {
    populateResidentOptions(selected.residentCode > 0 ? String(selected.residentCode) : "", {
      preserveStatus: Boolean(medicationState.residentLoadError),
    });
  }

  if (noveltyDateInput instanceof HTMLInputElement) {
    noveltyDateInput.value = selected.noveltyDate;
  }

  if (descriptionInput instanceof HTMLTextAreaElement) {
    descriptionInput.value = selected.description;
  }

  if (editingIdInput instanceof HTMLInputElement) {
    editingIdInput.value = selected.id;
  }

  setMedicationUserField(
    selected.userCode > 0 ? selected.userCode : medicationState.currentUser?.id || 0,
    medicationState.currentUser?.displayName || `Usuario #${selected.userCode || "sin id"}`,
    medicationState.currentUser?.docId || ""
  );

  medicationState.editingId = selected.id;

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.textContent = "Actualizar medicamento";
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.hidden = false;
  }

  if (nameInput instanceof HTMLInputElement) {
    nameInput.focus();
  }
}

function resetMedicationForm() {
  const form = document.getElementById("medicationForm");
  const submitButton = document.getElementById("medicationSubmitButton");
  const cancelButton = document.getElementById("medicationCancelButton");
  const editingIdInput = document.getElementById("medicationEditingId");

  if (form instanceof HTMLFormElement) {
    form.reset();
  }

  medicationState.editingId = "";

  if (editingIdInput instanceof HTMLInputElement) {
    editingIdInput.value = "";
  }

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.textContent = "Guardar medicamentos";
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.hidden = true;
  }

  initializeMedicationFormDefaults();
}

async function handleMedicationSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  if (medicationState.isSubmitting) {
    return;
  }

  const formData = new FormData(form);
  const name = String(formData.get("nombre_medic") || "").trim();
  const stockValue = Number(String(formData.get("stock") || "").trim());
  const entryDate = String(formData.get("fecha_entrada") || "").trim();
  const expiryDate = String(formData.get("fecha_vencimiento") || "").trim();
  const userCodeValue = Number(String(formData.get("cod_usuario") || "").trim());
  const residentCodeValue = Number(String(formData.get("cod_residente") || "").trim());
  const noveltyDate = String(formData.get("fecha_novedad") || "").trim();
  const description = String(formData.get("descrip_novedad") || "").trim();
  const editingId = medicationState.editingId || String(formData.get("editing_id") || "");
  const selected = medicationState.items.find((item) => item.id === editingId);

  if (!name) {
    mostrarError("Ingresa el nombre del medicamento.");
    return;
  }

  if (name.length > 10) {
    mostrarError("El nombre del medicamento no puede superar 10 caracteres.");
    return;
  }

  if (!Number.isInteger(stockValue) || stockValue < 0) {
    mostrarError("Ingresa un stock valido.");
    return;
  }

  if (!entryDate) {
    mostrarError("Selecciona la fecha de entrada.");
    return;
  }

  if (!expiryDate) {
    mostrarError("Selecciona la fecha de vencimiento.");
    return;
  }

  if (parseDate(expiryDate)?.getTime() < parseDate(entryDate)?.getTime()) {
    mostrarError("La fecha de vencimiento debe ser igual o posterior a la fecha de entrada.");
    return;
  }

  if (!Number.isInteger(userCodeValue) || userCodeValue <= 0) {
    mostrarError("No fue posible identificar al usuario autenticado.");
    return;
  }

  if (!Number.isInteger(residentCodeValue) || residentCodeValue <= 0) {
    mostrarError("Selecciona un residente valido.");
    return;
  }

  if (description.length > 100) {
    mostrarError("La descripcion de la novedad no puede superar 100 caracteres.");
    return;
  }

  medicationState.isSubmitting = true;
  setMedicationFormSubmittingState(true);

  const payload = {
    nombre_medic: name,
    fecha_entrada: entryDate,
    fecha_vencimiento: expiryDate,
    cod_usuario: userCodeValue,
    cod_residente: residentCodeValue,
    stock: stockValue,
  };

  if (description) {
    payload.descrip_novedad = description;
  }

  if (noveltyDate) {
    payload.fecha_novedad = noveltyDate;
  }

  try {
    if (selected) {
      await fetchJson(`${MEDICAMENTOS_API_BASE}/${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });
      await window.HgaAlerts.success("Medicamento actualizado correctamente");
    } else {
      await fetchJson(MEDICAMENTOS_API_BASE, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });
      await window.HgaAlerts.success("Medicamento registrado correctamente");
    }

    resetMedicationForm();
    await cargarMedicamentos(medicationState.pagination.currentPage || 1, { force: true });
  } catch (error) {
    console.error("Error al guardar medicamento:", error);
    mostrarError(`No fue posible guardar el medicamento: ${error.message}`);
  } finally {
    medicationState.isSubmitting = false;
    setMedicationFormSubmittingState(false);
  }
}

async function eliminarMedicamento(id) {
  const shouldDelete = await window.HgaAlerts.confirm(
    "¿Estas seguro de que deseas eliminar este medicamento?",
    "Eliminar medicamento"
  );

  if (!shouldDelete) {
    return;
  }

  try {
    await fetchJson(`${MEDICAMENTOS_API_BASE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: buildHeaders(false),
    });

    if (medicationState.editingId === id) {
      resetMedicationForm();
    }

    await window.HgaAlerts.success("Medicamento eliminado correctamente");
    await cargarMedicamentos(medicationState.pagination.currentPage || 1, { force: true });
  } catch (error) {
    console.error("Error al eliminar medicamento:", error);
    mostrarError(`Error al eliminar: ${error.message}`);
  }
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeDate(value) {
  const parsed = parseDate(value);
  if (!parsed) {
    return "Sin fecha";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(parsed);
  current.setHours(0, 0, 0, 0);

  const diffInDays = Math.round((today.getTime() - current.getTime()) / 86400000);

  if (diffInDays === 0) {
    return "Hoy";
  }

  if (diffInDays === 1) {
    return "Ayer";
  }

  return parsed.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(date) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readStoredUser() {
  try {
    const rawUser = localStorage.getItem("usuario");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuario");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mostrarError(mensaje) {
  window.HgaAlerts.error(mensaje);
}

function setMedicationFormSubmittingState(isSubmitting) {
  const submitButton = document.getElementById("medicationSubmitButton");
  const cancelButton = document.getElementById("medicationCancelButton");
  const form = document.getElementById("medicationForm");

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting
      ? "Guardando..."
      : medicationState.editingId
        ? "Actualizar medicamento"
        : "Guardar medicamentos";
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.disabled = isSubmitting;
  }

  if (form instanceof HTMLFormElement) {
    form.dataset.submitting = isSubmitting ? "true" : "false";
  }
}
