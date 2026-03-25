const RESIDENTES_API_ENDPOINT = `${window.location.origin}/api/residentes`;

const residentesState = {
  items: [],
  pendingDeleteIndex: null,
};

function getResidentesToken() {
  return localStorage.getItem("access_token") || "";
}

function getResidentesContainer() {
  return document.getElementById("residentesContainer");
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
    isNew: !residente.cod_residente,
  };
}

function buildResidenteCard(residente, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "residentes-card";
  wrapper.dataset.index = String(index);
  wrapper.dataset.codResidente = residente.cod_residente ? String(residente.cod_residente) : "";

  const deleteLabel = residente.cod_residente ? "Eliminar residente" : "Quitar bloque";

  wrapper.innerHTML = `
    <div class="fw-semibold mb-2" style="color: #2e7d32;">Residente ${String(index + 1).padStart(2, "0")}</div>
    <div class="bloque-residente p-3 p-md-4">
      <div class="residentes-actions">
        <button type="button" class="residentes-delete-btn" data-action="delete">${deleteLabel}</button>
      </div>
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-4">
          <label class="form-label label-sm">Nombre</label>
          <input type="text" class="form-control" data-field="nombre" value="${escapeHtml(residente.nombre)}" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label label-sm">Apellido</label>
          <input type="text" class="form-control" data-field="apellido" value="${escapeHtml(residente.apellido)}" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label label-sm">Patología</label>
          <input type="text" class="form-control" data-field="patologia" value="${escapeHtml(residente.patologia)}" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label label-sm">Edad</label>
          <input type="number" min="0" class="form-control" data-field="edad" value="${residente.edad === "" ? "" : escapeHtml(String(residente.edad))}" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label label-sm">RH</label>
          <input type="text" maxlength="6" class="form-control" data-field="RH" value="${escapeHtml(residente.RH)}" />
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
    empty.textContent = "Aún no hay residentes cargados. Agrega el primero para comenzar.";
    container.appendChild(empty);
    return;
  }

  residentesState.items.forEach((residente, index) => {
    container.appendChild(buildResidenteCard(residente, index));
  });
}

async function fetchResidentes() {
  const token = getResidentesToken();

  const response = await fetch(RESIDENTES_API_ENDPOINT, {
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

  return Array.isArray(data.data) ? data.data : [];
}

async function loadResidentes() {
  const token = getResidentesToken();

  if (!token) {
    await window.HgaAlerts.warning("Debes iniciar sesión para gestionar residentes.", "Sesión requerida");
    window.location.href = "login.html";
    return;
  }

  try {
    const residentes = await fetchResidentes();
    residentesState.items = residentes.map((item) => normalizeResidente(item));

    if (residentesState.items.length === 0) {
      residentesState.items.push(normalizeResidente({}));
    }

    renderResidentes();
  } catch (error) {
    console.error("Error al cargar residentes:", error);
    await window.HgaAlerts.error(error instanceof Error ? error.message : "No fue posible cargar los residentes.");
  }
}

function addResidente() {
  residentesState.items.push(normalizeResidente({}));
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
  const fields = ["nombre", "apellido", "patologia", "edad", "RH"];
  let valid = true;

  fields.forEach((field) => {
    const input = card.querySelector(`[data-field="${field}"]`);
    const value = field === "edad" ? payload.edad : payload[field];
    const hasError = field === "edad"
      ? !Number.isInteger(value) || value < 0
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

    await loadResidentes();
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

document.addEventListener("DOMContentLoaded", () => {
  bindResidentesEvents();
  loadResidentes();
});
