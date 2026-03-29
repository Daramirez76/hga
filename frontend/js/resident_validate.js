const RESIDENTES_API_ENDPOINT = `${window.location.origin}/api/residentes`;
const TUTORES_API_ENDPOINT = `${window.location.origin}/api/tutores`;
const ME_API_ENDPOINT = `${window.location.origin}/api/me`;
const RESIDENTES_PAGE_SIZE = window.HgaPagination?.DEFAULT_PAGE_SIZE || 5;

const residentesState = {
  items: [],
  allItems: [],
  pagination: {
    currentPage: 1,
    perPage: RESIDENTES_PAGE_SIZE,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
    serverPaginated: false,
  },
  paginationHost: null,
  pendingDeleteIndex: null,
  tutores: [],
  currentUser: null,
};

function getCurrentRoleCode() {
  if (window.HgaRoleAccess && typeof window.HgaRoleAccess.getRoleCode === "function") {
    return window.HgaRoleAccess.getRoleCode(residentesState.currentUser || undefined);
  }

  return Number(residentesState.currentUser?.cod_rol || 0);
}

function canManageResidentes() {
  return [1, 2].includes(getCurrentRoleCode());
}

function getResidentesToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
}

function getResidentesContainer() {
  return document.getElementById("residentesContainer");
}

function getPaginationHost() {
  if (residentesState.paginationHost instanceof HTMLElement) {
    return residentesState.paginationHost;
  }

  const container = getResidentesContainer();
  if (!(container instanceof HTMLElement)) {
    return null;
  }

  residentesState.paginationHost = window.HgaPagination?.ensureHost
    ? window.HgaPagination.ensureHost(container, "residentesPagination")
    : null;

  return residentesState.paginationHost;
}

function getDeleteModalElements() {
  return {
    modal: document.getElementById("residentesDeleteModal"),
    message: document.getElementById("residentesDeleteMessage"),
    confirmButton: document.getElementById("residentesDeleteConfirm"),
    cancelButton: document.getElementById("residentesDeleteCancel"),
  };
}

function normalizeResidente(residente = {}) {
  return {
    cod_residente: residente.cod_residente ? Number(residente.cod_residente) : null,
    nombre: String(residente.nombre || "").trim(),
    apellido: String(residente.apellido || "").trim(),
    patologia: String(residente.patologia || "").trim(),
    edad: residente.edad !== undefined && residente.edad !== null && residente.edad !== ""
      ? Number(residente.edad)
      : "",
    RH: String(residente.RH || residente.rh || "").trim().toUpperCase(),
    cod_usuario: residente.cod_usuario ? Number(residente.cod_usuario) : null,
    isNew: !residente.cod_residente,
  };
}

function getTutorOptionsMarkup(selectedDocId) {
  const options = residentesState.tutores.map((tutor) => {
    const docId = Number(tutor.doc_id);
    const fullName = [tutor.nombre, tutor.apellido].filter(Boolean).join(" ").trim() || `Tutor #${docId}`;
    const labelParts = [fullName];

    if (tutor.parentesco) {
      labelParts.push(`(${tutor.parentesco})`);
    }

    if (tutor.email) {
      labelParts.push(`- ${tutor.email}`);
    }

    const selected = selectedDocId === docId ? " selected" : "";
    return `<option value="${escapeHtml(String(docId))}"${selected}>${escapeHtml(labelParts.join(" "))}</option>`;
  });

  const hasSelected = Number.isInteger(selectedDocId) && selectedDocId > 0;
  const knownOption = hasSelected
    ? residentesState.tutores.some((tutor) => Number(tutor.doc_id) === selectedDocId)
    : false;

  if (hasSelected && !knownOption) {
    options.unshift(`<option value="${escapeHtml(String(selectedDocId))}" selected>${escapeHtml(`Tutor asignado #${selectedDocId}`)}</option>`);
  } else {
    options.unshift('<option value="">Selecciona un tutor responsable</option>');
  }

  return options.join("");
}

function buildResidenteCard(residente, index) {
  const readOnly = !canManageResidentes();
  const wrapper = document.createElement("div");
  wrapper.className = "residentes-card";
  wrapper.dataset.index = String(index);
  wrapper.dataset.codResidente = residente.cod_residente ? String(residente.cod_residente) : "";

  const deleteLabel = residente.cod_residente ? "Eliminar residente" : "Quitar bloque";
  const deleteButtonMarkup = readOnly
    ? ""
    : `<button type="button" class="residentes-delete-btn" data-action="delete">${deleteLabel}</button>`;
  const textInputMode = readOnly ? 'readonly' : '';
  const numberInputMode = readOnly ? 'readonly' : '';
  const selectInputMode = readOnly ? 'disabled' : '';

  wrapper.innerHTML = `
    <div class="residentes-card-title">Residente</div>
    <div class="bloque-residente">
      <div class="residentes-actions">
        ${deleteButtonMarkup}
      </div>
      <div class="residentes-fields">
        <div class="residentes-field">
          <label class="form-label label-sm">Nombre</label>
          <input type="text" class="form-control" data-field="nombre" value="${escapeHtml(residente.nombre)}" ${textInputMode} />
        </div>
        <div class="residentes-field">
          <label class="form-label label-sm">Apellidos</label>
          <input type="text" class="form-control" data-field="apellido" value="${escapeHtml(residente.apellido)}" ${textInputMode} />
        </div>
        <div class="residentes-field">
          <label class="form-label label-sm">Patología</label>
          <input type="text" class="form-control" data-field="patologia" value="${escapeHtml(residente.patologia)}" ${textInputMode} />
        </div>
        <div class="residentes-field">
          <label class="form-label label-sm">Edad</label>
          <input type="number" min="0" class="form-control" data-field="edad" value="${residente.edad === "" ? "" : escapeHtml(String(residente.edad))}" ${numberInputMode} />
        </div>
        <div class="residentes-field">
          <label class="form-label label-sm">RH</label>
          <input type="text" maxlength="6" class="form-control" data-field="RH" value="${escapeHtml(residente.RH)}" ${textInputMode} />
        </div>
        <div class="residentes-field">
          <label class="form-label label-sm">Tutor responsable</label>
          <select class="form-control" data-field="cod_usuario" ${selectInputMode}>
            ${getTutorOptionsMarkup(residente.cod_usuario)}
          </select>
        </div>
        <div class="residentes-field">
          <label class="form-label label-sm">Código residente</label>
          <input type="text" class="form-control" value="${residente.cod_residente ? escapeHtml(String(residente.cod_residente)) : ""}" readonly />
        </div>
      </div>
    </div>
  `;

  return wrapper;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderResidentes() {
  const container = getResidentesContainer();

  if (!(container instanceof HTMLElement)) {
    return;
  }

  container.innerHTML = "";

  if (residentesState.items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "residentes-empty";
    empty.textContent = canManageResidentes()
      ? "Aún no hay residentes cargados. Agrega el primero para comenzar."
      : "No hay residentes asociados a esta cuenta.";
    container.appendChild(empty);
    renderPaginationControls();
    return;
  }

  residentesState.items.forEach((residente, index) => {
    container.appendChild(buildResidenteCard(residente, index));
  });

  renderPaginationControls();
}

function renderPaginationControls() {
  const host = getPaginationHost();

  if (!(host instanceof HTMLElement) || !window.HgaPagination) {
    return;
  }

  window.HgaPagination.renderControls(host, residentesState.pagination, (page) => {
    void loadResidentes(page, { force: true });
  }, {
    itemLabel: "residentes",
    ariaLabel: "Paginación de residentes",
  });
}

async function fetchResidentes(page = 1) {
  const token = getResidentesToken();
  const url = window.HgaPagination?.buildUrl
    ? window.HgaPagination.buildUrl(RESIDENTES_API_ENDPOINT, {
        page,
        per_page: RESIDENTES_PAGE_SIZE,
      })
    : `${RESIDENTES_API_ENDPOINT}?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(RESIDENTES_PAGE_SIZE))}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "No fue posible cargar los residentes.");
  }

  return data;
}

async function fetchCurrentUser() {
  const token = getResidentesToken();

  const response = await fetch(ME_API_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "No fue posible cargar la sesión actual.");
  }

  return data.user || null;
}

async function fetchTutores() {
  const token = getResidentesToken();

  const response = await fetch(TUTORES_API_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "No fue posible cargar los tutores.");
  }

  return Array.isArray(data.data) ? data.data : [];
}

async function loadResidentes(page = residentesState.pagination.currentPage || 1, options = {}) {
  const token = getResidentesToken();

  if (!token) {
    await window.HgaAlerts.warning("Debes iniciar sesión para gestionar residentes.", "Sesión requerida");
    window.location.href = "login.html";
    return;
  }

  try {
    const currentUser = await fetchCurrentUser();
    residentesState.currentUser = currentUser;

    const tutores = canManageResidentes() ? await fetchTutores() : [];
    const payload = await fetchResidentes(page);

    residentesState.tutores = tutores;
    const normalized = window.HgaPagination?.normalizeResponse
      ? window.HgaPagination.normalizeResponse(payload, {
          page,
          perPage: RESIDENTES_PAGE_SIZE,
        })
      : {
          items: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
          meta: {
            currentPage: page,
            perPage: RESIDENTES_PAGE_SIZE,
            total: Array.isArray(payload?.data) ? payload.data.length : Array.isArray(payload) ? payload.length : 0,
            lastPage: 1,
            from: 0,
            to: 0,
            serverPaginated: false,
          },
        };

    applyRoleMode();
    residentesState.pagination = normalized.meta;
    residentesState.allItems = normalized.items.map(normalizeResidente);
    residentesState.items = normalized.meta.serverPaginated
      ? residentesState.allItems.slice()
      : (window.HgaPagination?.slicePage
        ? window.HgaPagination.slicePage(residentesState.allItems, normalized.meta.currentPage, normalized.meta.perPage)
        : residentesState.allItems.slice((normalized.meta.currentPage - 1) * normalized.meta.perPage, normalized.meta.currentPage * normalized.meta.perPage));

    if (residentesState.items.length === 0 && canManageResidentes() && normalized.meta.currentPage === 1) {
      const defaultTutor = currentUser && Number(currentUser.cod_rol) === 4 ? Number(currentUser.doc_id) : null;
      residentesState.items.push(normalizeResidente({ cod_usuario: defaultTutor }));
    }

    renderResidentes();
  } catch (error) {
    console.error("Error al cargar residentes:", error);
    await window.HgaAlerts.error(error instanceof Error ? error.message : "No fue posible cargar los residentes.");
  }
}

function addResidente() {
  if (!canManageResidentes()) {
    return;
  }

  const currentUser = residentesState.currentUser;
  const defaultTutor = currentUser && Number(currentUser.cod_rol) === 4 ? Number(currentUser.doc_id) : null;
  residentesState.items.push(normalizeResidente({ cod_usuario: defaultTutor }));
  renderResidentes();
}

function readCardPayload(card) {
  const getField = (field) => card.querySelector(`[data-field="${field}"]`);
  const payload = {
    cod_residente: card.dataset.codResidente ? Number(card.dataset.codResidente) : null,
    nombre: String(getField("nombre")?.value || "").trim(),
    apellido: String(getField("apellido")?.value || "").trim(),
    patologia: String(getField("patologia")?.value || "").trim(),
    edad: Number(String(getField("edad")?.value || "").trim()),
    RH: String(getField("RH")?.value || "").trim().toUpperCase(),
    cod_usuario: Number(String(getField("cod_usuario")?.value || "").trim()),
  };

  return payload;
}

function markCardError(input, hasError) {
  if (!(input instanceof HTMLElement)) {
    return;
  }

  input.style.borderColor = hasError ? "#f44336" : "#c8e6c9";
}

function validateCard(card) {
  const payload = readCardPayload(card);
  const fields = ["nombre", "apellido", "patologia", "edad", "RH", "cod_usuario"];
  let valid = true;

  fields.forEach((field) => {
    const input = card.querySelector(`[data-field="${field}"]`);
    const value = field === "edad" ? payload.edad : payload[field];
    const hasError = field === "edad"
      ? !Number.isInteger(value) || value < 0
      : field === "cod_usuario"
        ? !Number.isInteger(value) || value <= 0
        : !String(value || "").trim();

    markCardError(input, hasError);
    if (hasError) {
      valid = false;
    }
  });

  return valid;
}

function collectResidentesPayload() {
  const container = getResidentesContainer();

  if (!(container instanceof HTMLElement)) {
    return [];
  }

  return Array.from(container.querySelectorAll(".residentes-card")).map((card) => ({
    card,
    payload: readCardPayload(card),
  }));
}

async function saveResidente(payload) {
  const token = getResidentesToken();
  const isUpdate = Boolean(payload.cod_residente);
  const endpoint = isUpdate
    ? `${RESIDENTES_API_ENDPOINT}/${payload.cod_residente}`
    : RESIDENTES_API_ENDPOINT;

  const body = { ...payload };
  if (!isUpdate) {
    delete body.cod_residente;
  }

  const response = await fetch(endpoint, {
    method: isUpdate ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errors = Object.values(data.errors || {}).flat().filter(Boolean);
    throw new Error(errors[0] || data.message || "No fue posible guardar el residente.");
  }

  return data.data || null;
}

async function deleteResidente(index) {
  const residente = residentesState.items[index];

  if (!residente) {
    return;
  }

  if (!residente.cod_residente) {
    residentesState.items.splice(index, 1);
    if (residentesState.items.length === 0) {
      residentesState.items.push(normalizeResidente({}));
    }
    renderResidentes();
    return;
  }

  const token = getResidentesToken();
  const response = await fetch(`${RESIDENTES_API_ENDPOINT}/${residente.cod_residente}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "No fue posible eliminar el residente.");
  }

  residentesState.items.splice(index, 1);
  if (residentesState.items.length === 0) {
    residentesState.items.push(normalizeResidente({}));
  }
  renderResidentes();
}

function setDeleteModalVisible(isVisible) {
  const { modal } = getDeleteModalElements();

  if (!(modal instanceof HTMLElement)) {
    return;
  }

  modal.classList.toggle("show", isVisible);
  modal.setAttribute("aria-hidden", String(!isVisible));
  document.body.style.overflow = isVisible ? "hidden" : "";
}

function openDeleteModal(index) {
  const residente = residentesState.items[index];
  const { message } = getDeleteModalElements();

  if (!residente) {
    return;
  }

  residentesState.pendingDeleteIndex = index;

  if (message instanceof HTMLElement) {
    const label = [residente.nombre, residente.apellido].filter(Boolean).join(" ").trim() || "este residente";
    message.textContent = `¿Estás seguro de que quieres eliminar a ${label}?`;
  }

  setDeleteModalVisible(true);
}

function closeDeleteModal() {
  residentesState.pendingDeleteIndex = null;
  setDeleteModalVisible(false);
}

function handleDeleteClick(event) {
  const button = event.target.closest('[data-action="delete"]');

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const card = button.closest(".residentes-card");
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const index = Number(card.dataset.index || "-1");
  if (index < 0) {
    return;
  }

  openDeleteModal(index);
}

async function handleDeleteConfirm() {
  if (!canManageResidentes()) {
    closeDeleteModal();
    return;
  }

  const index = residentesState.pendingDeleteIndex;

  if (typeof index !== "number" || index < 0) {
    closeDeleteModal();
    return;
  }

  const { confirmButton, cancelButton } = getDeleteModalElements();

  if (confirmButton instanceof HTMLButtonElement) {
    confirmButton.disabled = true;
    confirmButton.textContent = "Eliminando...";
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.disabled = true;
  }

  try {
    await deleteResidente(index);
    closeDeleteModal();
    await window.HgaAlerts.success("Residente eliminado correctamente");
    await loadResidentes(residentesState.pagination.currentPage || 1, { force: true });
  } catch (error) {
    console.error("Error al eliminar residente:", error);
    await window.HgaAlerts.error(error instanceof Error ? error.message : "No fue posible eliminar el residente.");
  } finally {
    if (confirmButton instanceof HTMLButtonElement) {
      confirmButton.disabled = false;
      confirmButton.textContent = "Eliminar";
    }

    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.disabled = false;
    }
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!canManageResidentes()) {
    return;
  }

  const saveButton = document.getElementById("guardarResidentes");
  if (saveButton instanceof HTMLButtonElement) {
    saveButton.disabled = true;
    saveButton.textContent = "Guardando...";
  }

  try {
    const items = collectResidentesPayload();

    if (items.length === 0) {
      await window.HgaAlerts.warning("Agrega al menos un residente antes de guardar.");
      return;
    }

    const hasInvalidCards = items.some(({ card }) => !validateCard(card));
    if (hasInvalidCards) {
      await window.HgaAlerts.warning("Revisa los campos obligatorios de cada residente.", "Formulario incompleto");
      return;
    }

    for (const item of items) {
      await saveResidente(item.payload);
    }

    await loadResidentes(residentesState.pagination.currentPage || 1, { force: true });
    await window.HgaAlerts.success("Residentes guardados correctamente");
  } catch (error) {
    console.error("Error al guardar residentes:", error);
    await window.HgaAlerts.error(error instanceof Error ? error.message : "No fue posible guardar los residentes.");
  } finally {
    if (saveButton instanceof HTMLButtonElement) {
      saveButton.disabled = false;
      saveButton.textContent = "Gestionar Residentes";
    }
  }
}

function bindResidentesEvents() {
  const form = document.getElementById("formResidentes");
  const addButton = document.getElementById("agregarResidente");
  const container = getResidentesContainer();
  const { modal, confirmButton, cancelButton } = getDeleteModalElements();

  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", handleSubmit);
  }

  if (addButton instanceof HTMLButtonElement) {
    addButton.addEventListener("click", addResidente);
  }

  if (container instanceof HTMLElement) {
    container.addEventListener("click", handleDeleteClick);
  }

  if (confirmButton instanceof HTMLButtonElement) {
    confirmButton.addEventListener("click", handleDeleteConfirm);
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener("click", closeDeleteModal);
  }

  if (modal instanceof HTMLElement) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeDeleteModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDeleteModal();
    }
  });
}

function applyRoleMode() {
  const addButton = document.getElementById("agregarResidente");
  const saveButton = document.getElementById("guardarResidentes");
  const canManage = canManageResidentes();

  if (addButton instanceof HTMLButtonElement) {
    addButton.hidden = !canManage;
  }

  if (saveButton instanceof HTMLButtonElement) {
    saveButton.hidden = !canManage;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindResidentesEvents();
  loadResidentes();
});
