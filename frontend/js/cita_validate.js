const CITAS_API_URL = `${window.location.origin}/api/citas`;
const LOGIN_URL = "login.html";

const citasState = {
  citas: [],
  filtroActivo: false,
  cargando: false,
  detalleId: null,
  editandoId: null,
  isSubmitting: false,
};

const citaInputIds = [
  "regCodCita",
  "regFecha",
  "regHoraInicio",
  "regHoraFin",
  "regNombreAcompanante",
  "regCodResidente",
  "regLugar",
];

document.addEventListener("DOMContentLoaded", () => {
  setupProfileMenu();
  setupCitaFieldValidation();
  setupEscapeShortcuts();
  cargarCitas();
});

function getStoredToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
}

function clearStoredSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuario");
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

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  const parsed = new Date(normalized.includes("T") ? normalized : `${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateDisplay(value) {
  const parsed = parseDate(value);
  if (!parsed) {
    return String(value ?? "—");
  }

  return parsed.toLocaleDateString("es-ES");
}

function formatTimeDisplay(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "—";
  }

  return normalized.slice(0, 5);
}

function normalizeCita(item) {
  const source = item || {};
  const codCita = source.cod_cita ?? source.codCita ?? source.id ?? "";
  const idNumber = Number.parseInt(String(codCita), 10);

  return {
    raw: source,
    id: Number.isNaN(idNumber) ? String(codCita) : idNumber,
    codCita: String(codCita),
    fecha: String(source.Fecha_cita ?? source.fecha ?? "").trim(),
    horaInicio: String(source.hora_inicio ?? source.horaInicio ?? "").trim(),
    horaFin: String(source.hora_fin ?? source.horaFin ?? "").trim(),
    acompanante: String(source["Nombre_acompañante"] ?? source.Nombre_acompanante ?? source.acompanante ?? "").trim(),
    lugar: String(source.Lugar_cita ?? source.lugar ?? "").trim(),
    codResidente: String(source.cod_Residente ?? source.cod_residente ?? source.codResidente ?? "").trim(),
  };
}

function findCitaById(id) {
  return citasState.citas.find((item) => String(item.id) === String(id));
}

function getCitaInputs() {
  return citaInputIds
    .map((id) => document.getElementById(id))
    .filter((input) => input instanceof HTMLInputElement);
}

function setupCitaFieldValidation() {
  getCitaInputs().forEach((input) => {
    input.addEventListener("input", () => {
      if (input.value.trim() !== "") {
        input.style.borderColor = "#c8e6c9";
      }
    });

    input.addEventListener("blur", () => {
      if (input.readOnly) {
        return;
      }

      if (input.value.trim() === "") {
        input.style.borderColor = "#f44336";
      }
    });
  });
}

function setupProfileMenu() {
  const profileBtn = document.getElementById("profileBtn");
  const profileDrop = document.getElementById("profileDrop");

  if (!(profileBtn instanceof HTMLElement) || !(profileDrop instanceof HTMLElement)) {
    return;
  }

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    profileDrop.classList.toggle("show");
  });

  document.addEventListener("click", (event) => {
    if (!profileDrop.contains(event.target) && !profileBtn.contains(event.target)) {
      profileDrop.classList.remove("show");
    }
  });
}

function setupEscapeShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cerrarOverlay();
      cerrarDetalle();
    }
  });
}

function setSuggestedCodCita() {
  const input = document.getElementById("regCodCita");
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const maxCode = citasState.citas.reduce((maxValue, cita) => {
    const numericCode = Number.parseInt(String(cita.codCita), 10);
    return Number.isNaN(numericCode) ? maxValue : Math.max(maxValue, numericCode);
  }, 0);

  input.value = String(maxCode + 1);
  input.style.borderColor = "#c8e6c9";
}

function setLoadingState(isLoading) {
  citasState.cargando = isLoading;

  const container = document.getElementById("listaCitas");
  if (container instanceof HTMLElement && isLoading) {
    container.innerHTML = '<div class="sin-resultados">Cargando citas...</div>';
  }
}

function renderCitas(lista) {
  const container = document.getElementById("listaCitas");

  if (!(container instanceof HTMLElement)) {
    return;
  }

  if (!Array.isArray(lista) || lista.length === 0) {
    container.innerHTML = '<div class="sin-resultados">No se encontraron citas.</div>';
    return;
  }

  container.innerHTML = lista
    .map((cita) => `
      <div class="cita-item" onclick='abrirDetalle(${JSON.stringify(cita.id)})'>
        <span class="cita-bullet">•</span>
        <div>
          <div><strong>Cita ${escapeHtml(cita.codCita || cita.id)}</strong> ${escapeHtml(cita.acompanante || "Sin acompañante")}</div>
          <div class="cita-meta">
            ${cita.fecha ? `<span class="cita-badge badge-fecha">📅 ${escapeHtml(formatDateDisplay(cita.fecha))}</span>` : ""}
            ${cita.horaInicio ? `<span class="cita-badge badge-hora">🕐 ${escapeHtml(formatTimeDisplay(cita.horaInicio))} - ${escapeHtml(formatTimeDisplay(cita.horaFin))}</span>` : ""}
            ${cita.lugar ? `<span class="cita-badge badge-lugar">📍 ${escapeHtml(cita.lugar)}</span>` : ""}
            ${cita.codResidente ? `<span class="cita-badge badge-codigo">👤 Res. ${escapeHtml(cita.codResidente)}</span>` : ""}
          </div>
        </div>
      </div>
    `)
    .join("");
}

function applyCurrentFilter() {
  const input = document.getElementById("filtroInput");

  if (!(input instanceof HTMLInputElement)) {
    renderCitas(citasState.citas);
    return;
  }

  const query = input.value.toLowerCase().trim();
  if (!query) {
    renderCitas(citasState.citas);
    return;
  }

  const filtradas = citasState.citas.filter((cita) => {
    return [
      cita.codCita,
      cita.fecha,
      cita.horaInicio,
      cita.horaFin,
      cita.acompanante,
      cita.lugar,
      cita.codResidente,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  renderCitas(filtradas);
}

async function cargarCitas() {
  const token = getStoredToken();
  if (!token) {
    await handleUnauthorized();
    return;
  }

  setLoadingState(true);

  try {
    const data = await requestJson(CITAS_API_URL, {
      method: "GET",
      headers: buildHeaders(false),
    });

    const registros = Array.isArray(data.data) ? data.data : [];
    citasState.citas = registros.map(normalizeCita);
    citasState.citas.sort((a, b) => Number.parseInt(String(b.codCita), 10) - Number.parseInt(String(a.codCita), 10));

    if (citasState.filtroActivo) {
      applyCurrentFilter();
    } else {
      renderCitas(citasState.citas);
    }
  } catch (error) {
    if (error.message === "Sesion expirada") {
      return;
    }

    console.error("Error al cargar citas:", error);
    const container = document.getElementById("listaCitas");
    if (container instanceof HTMLElement) {
      container.innerHTML = '<div class="sin-resultados">No fue posible cargar las citas.</div>';
    }
  } finally {
    setLoadingState(false);
  }
}

function abrirDetalle(id) {
  const cita = findCitaById(id);
  const detalleContenido = document.getElementById("detalleContenido");
  const overlayDetalle = document.getElementById("overlayDetalle");

  if (!cita || !(detalleContenido instanceof HTMLElement) || !(overlayDetalle instanceof HTMLElement)) {
    return;
  }

  citasState.detalleId = String(cita.id);

  detalleContenido.innerHTML = `
    <div class="detalle-fila"><span class="detalle-icono">🔖</span><span class="detalle-key">Codigo Cita</span><span class="detalle-val">${escapeHtml(cita.codCita || "—")}</span></div>
    <div class="detalle-fila"><span class="detalle-icono">📅</span><span class="detalle-key">Fecha</span><span class="detalle-val">${escapeHtml(formatDateDisplay(cita.fecha) || "—")}</span></div>
    <div class="detalle-fila"><span class="detalle-icono">🕐</span><span class="detalle-key">Hora</span><span class="detalle-val">${cita.horaInicio && cita.horaFin ? `${escapeHtml(formatTimeDisplay(cita.horaInicio))} — ${escapeHtml(formatTimeDisplay(cita.horaFin))}` : "—"}</span></div>
    <div class="detalle-fila"><span class="detalle-icono">👤</span><span class="detalle-key">Acompañante</span><span class="detalle-val">${escapeHtml(cita.acompanante || "—")}</span></div>
    <div class="detalle-fila"><span class="detalle-icono">🏥</span><span class="detalle-key">Lugar</span><span class="detalle-val">${escapeHtml(cita.lugar || "—")}</span></div>
    <div class="detalle-fila"><span class="detalle-icono">👤</span><span class="detalle-key">Cod. Residente</span><span class="detalle-val">${escapeHtml(cita.codResidente || "—")}</span></div>
  `;

  overlayDetalle.classList.add("show");
}

function cerrarDetalle() {
  const overlayDetalle = document.getElementById("overlayDetalle");
  if (overlayDetalle instanceof HTMLElement) {
    overlayDetalle.classList.remove("show");
  }

  citasState.detalleId = null;
}

function clickFueraDetalle(event) {
  const overlayDetalle = document.getElementById("overlayDetalle");
  if (event.target === overlayDetalle) {
    cerrarDetalle();
  }
}

function toggleFiltro() {
  const wrap = document.getElementById("filtroWrap");
  const input = document.getElementById("filtroInput");

  if (!(wrap instanceof HTMLElement) || !(input instanceof HTMLInputElement)) {
    return;
  }

  citasState.filtroActivo = !citasState.filtroActivo;
  wrap.classList.toggle("show", citasState.filtroActivo);

  if (citasState.filtroActivo) {
    input.focus();
    return;
  }

  input.value = "";
  renderCitas(citasState.citas);
}

function filtrarCitas() {
  citasState.filtroActivo = true;
  applyCurrentFilter();
}

function getInputValue(id) {
  const input = document.getElementById(id);
  return input instanceof HTMLInputElement ? input.value.trim() : "";
}

function limpiarFormulario() {
  getCitaInputs().forEach((input) => {
    if (input.readOnly) {
      input.value = "";
      return;
    }

    input.value = "";
    input.style.borderColor = "#b3ddbf";
  });

  citasState.editandoId = null;
  setOverlayMode("create");
}

function setOverlayMode(mode) {
  const title = document.querySelector("#overlayCard .ov-titulo");
  const submitButton = document.querySelector("#overlayCard .btn-confirmar");

  if (title instanceof HTMLElement) {
    title.textContent = mode === "edit" ? "📋 Editar cita" : "📋 Registrar nueva Cita";
  }

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.textContent = mode === "edit" ? "ACTUALIZAR" : "CONFIRMAR";
  }
}

function fillFormFromCita(cita) {
  const codeInput = document.getElementById("regCodCita");
  const fechaInput = document.getElementById("regFecha");
  const horaInicioInput = document.getElementById("regHoraInicio");
  const horaFinInput = document.getElementById("regHoraFin");
  const acompananteInput = document.getElementById("regNombreAcompanante");
  const residenteInput = document.getElementById("regCodResidente");
  const lugarInput = document.getElementById("regLugar");

  if (codeInput instanceof HTMLInputElement) {
    codeInput.value = String(cita.codCita ?? "");
  }

  if (fechaInput instanceof HTMLInputElement) {
    fechaInput.value = cita.fecha;
  }

  if (horaInicioInput instanceof HTMLInputElement) {
    horaInicioInput.value = formatTimeForInput(cita.horaInicio);
  }

  if (horaFinInput instanceof HTMLInputElement) {
    horaFinInput.value = formatTimeForInput(cita.horaFin);
  }

  if (acompananteInput instanceof HTMLInputElement) {
    acompananteInput.value = cita.acompanante;
  }

  if (residenteInput instanceof HTMLInputElement) {
    residenteInput.value = cita.codResidente;
  }

  if (lugarInput instanceof HTMLInputElement) {
    lugarInput.value = cita.lugar;
  }
}

function formatTimeForInput(value) {
  return String(value ?? "").trim().slice(0, 5);
}

function abrirOverlay() {
  const overlay = document.getElementById("overlayFondo");
  if (overlay instanceof HTMLElement) {
    overlay.classList.add("show");
  }

  limpiarFormulario();
  setSuggestedCodCita();
}

function editarCitaDesdeDetalle() {
  const cita = findCitaById(citasState.detalleId);
  const overlay = document.getElementById("overlayFondo");

  if (!cita || !(overlay instanceof HTMLElement)) {
    return;
  }

  cerrarDetalle();
  fillFormFromCita(cita);
  citasState.editandoId = String(cita.id);
  setOverlayMode("edit");
  overlay.classList.add("show");
}

function cerrarOverlay() {
  const overlay = document.getElementById("overlayFondo");
  if (overlay instanceof HTMLElement) {
    overlay.classList.remove("show");
  }
}

function clickFuera(event) {
  const overlay = document.getElementById("overlayFondo");
  if (event.target === overlay) {
    cerrarOverlay();
  }
}

function buildPayload() {
  return {
    Fecha_cita: getInputValue("regFecha"),
    hora_inicio: getInputValue("regHoraInicio"),
    hora_fin: getInputValue("regHoraFin"),
    Nombre_acompañante: getInputValue("regNombreAcompanante"),
    Lugar_cita: getInputValue("regLugar"),
    cod_Residente: Number.parseInt(getInputValue("regCodResidente"), 10),
  };
}

function validatePayload(payload) {
  const errors = [];

  if (!payload.Fecha_cita) {
    errors.push("La fecha de la cita es obligatoria.");
  }

  if (!payload.hora_inicio) {
    errors.push("La hora de inicio es obligatoria.");
  }

  if (!payload.hora_fin) {
    errors.push("La hora de fin es obligatoria.");
  }

  if (payload.hora_inicio && payload.hora_fin && payload.hora_fin <= payload.hora_inicio) {
    errors.push("La hora de fin debe ser posterior a la hora de inicio.");
  }

  if (!payload.Nombre_acompañante) {
    errors.push("El nombre del acompañante es obligatorio.");
  } else if (payload.Nombre_acompañante.length > 50) {
    errors.push("El nombre del acompañante no puede superar 50 caracteres.");
  }

  if (!payload.Lugar_cita) {
    errors.push("El lugar de la cita es obligatorio.");
  } else if (payload.Lugar_cita.length > 30) {
    errors.push("El lugar de la cita no puede superar 30 caracteres.");
  }

  if (!Number.isInteger(payload.cod_Residente) || payload.cod_Residente <= 0) {
    errors.push("El código del residente es obligatorio y debe ser numérico.");
  }

  return errors;
}

async function confirmarCita() {
  if (citasState.isSubmitting) {
    return;
  }

  const payload = buildPayload();
  const errores = validatePayload(payload);

  getCitaInputs().forEach((input) => {
    if (input.readOnly) {
      return;
    }

    input.style.borderColor = input.value.trim() === "" ? "#f44336" : "#c8e6c9";
  });

  if (errores.length > 0) {
    if (window.HgaAlerts?.warning) {
      await window.HgaAlerts.warning(errores.join("\n"), "Formulario incompleto");
    } else {
      window.alert(errores.join("\n"));
    }
    return;
  }

  const token = getStoredToken();
  if (!token) {
    await handleUnauthorized();
    return;
  }

  try {
    citasState.isSubmitting = true;

    const requestUrl = citasState.editandoId ? `${CITAS_API_URL}/${encodeURIComponent(citasState.editandoId)}` : CITAS_API_URL;
    const requestMethod = citasState.editandoId ? "PUT" : "POST";

    await requestJson(requestUrl, {
      method: requestMethod,
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (window.HgaAlerts?.success) {
      await window.HgaAlerts.success(
        citasState.editandoId ? "La cita medica fue actualizada correctamente" : "La cita medica fue registrada correctamente"
      );
    }

    cerrarOverlay();
    await cargarCitas();
  } catch (error) {
    if (error.message === "Sesion expirada") {
      return;
    }

    console.error("Error al registrar cita:", error);

    if (window.HgaAlerts?.error) {
      await window.HgaAlerts.error(`No se pudo registrar la cita: ${error.message}`);
    } else {
      window.alert(`No se pudo registrar la cita: ${error.message}`);
    }
  } finally {
    citasState.isSubmitting = false;
  }
}

async function eliminarCitaDesdeDetalle() {
  const cita = findCitaById(citasState.detalleId);

  if (!cita) {
    return;
  }

  const shouldDelete = window.HgaAlerts?.confirm
    ? await window.HgaAlerts.confirm(`¿Seguro que deseas eliminar la cita ${cita.codCita}?`, "Eliminar cita")
    : window.confirm(`¿Seguro que deseas eliminar la cita ${cita.codCita}?`);

  if (!shouldDelete) {
    return;
  }

  try {
    await requestJson(`${CITAS_API_URL}/${encodeURIComponent(cita.id)}`, {
      method: "DELETE",
      headers: buildHeaders(false),
    });

    cerrarDetalle();

    if (window.HgaAlerts?.success) {
      await window.HgaAlerts.success("La cita medica fue eliminada correctamente");
    }

    await cargarCitas();
  } catch (error) {
    if (error.message === "Sesion expirada") {
      return;
    }

    if (window.HgaAlerts?.error) {
      await window.HgaAlerts.error(`No se pudo eliminar la cita: ${error.message}`);
    } else {
      window.alert(`No se pudo eliminar la cita: ${error.message}`);
    }
  }
}

window.renderCitas = renderCitas;
window.abrirDetalle = abrirDetalle;
window.editarCitaDesdeDetalle = editarCitaDesdeDetalle;
window.eliminarCitaDesdeDetalle = eliminarCitaDesdeDetalle;
window.cerrarDetalle = cerrarDetalle;
window.clickFueraDetalle = clickFueraDetalle;
window.toggleFiltro = toggleFiltro;
window.filtrarCitas = filtrarCitas;
window.abrirOverlay = abrirOverlay;
window.cerrarOverlay = cerrarOverlay;
window.clickFuera = clickFuera;
window.confirmarCita = confirmarCita;
