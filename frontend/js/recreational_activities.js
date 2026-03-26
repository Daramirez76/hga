const API_BASE = `${window.location.origin}/api/actividades`;
const LOGIN_URL = 'login.html';

let actividadEditandoId = null;
let isSubmitting = false;
let currentFilter = '';
let actividadesCache = [];

function getCurrentRoleCode() {
  return window.HgaRoleAccess && typeof window.HgaRoleAccess.getRoleCode === 'function'
    ? window.HgaRoleAccess.getRoleCode()
    : 0;
}

function canManageActividades() {
  return [1, 2].includes(getCurrentRoleCode());
}

function getStoredToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('authToken') || '';
}

function clearStoredSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
}

function buildHeaders(includeJson = true) {
  const headers = {
    Accept: 'application/json',
  };

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
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
      await window.HgaAlerts.warning('Tu sesión expiró. Vuelve a iniciar sesión.', 'Sesión requerida');
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
    throw new Error('Sesion expirada');
  }

  if (!response.ok) {
    const validationMessage = extractValidationMessage(data);
    throw new Error(validationMessage || data.message || `Error HTTP ${response.status}`);
  }

  return data;
}

function extractValidationMessage(data) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const rawErrors = data.errors;
  if (!rawErrors || typeof rawErrors !== 'object') {
    return '';
  }

  const messages = Object.values(rawErrors)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  return messages.join('\n');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function parseDateForDisplay(value) {
  if (!value) {
    return 'Fecha pendiente';
  }

  const normalized = String(value).trim();
  const parsed = new Date(normalized.includes('T') ? normalized : `${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return parsed.toLocaleDateString('es-ES');
}

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  const normalized = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTimeForInput(value) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return '';
  }

  return normalized.slice(0, 5);
}

function normalizeActividad(item) {
  const normalized = item || {};
  const id = normalized.Cod_acti_ludi ?? normalized.cod_acti_ludi ?? normalized.id ?? '';

  return {
    raw: normalized,
    id: String(id),
    nombre: String(normalized.Nombre ?? '').trim(),
    fecha: String(normalized.Fecha ?? '').trim(),
    horaInicio: String(normalized.Hora_ini ?? '').trim(),
    horaFin: String(normalized.Hora_fin ?? '').trim(),
    lugar: String(normalized.Lugar ?? '').trim(),
    codResidente: Number(normalized.cod_residente ?? 0),
  };
}

function getFormElements() {
  return {
    form: document.getElementById('activityForm'),
    panel: document.getElementById('activityForm'),
    title: document.querySelector('#activityForm h6'),
    submitButton: document.querySelector('#activityForm .btn-confirmar'),
    discardButton: document.getElementById('discardActivityForm'),
    filterInput: document.getElementById('filtro'),
    lista: document.getElementById('lista'),
    nombre: document.getElementById('actividadNombre'),
    fecha: document.getElementById('actividadFecha'),
    horaInicio: document.getElementById('actividadHoraInicio'),
    horaFin: document.getElementById('actividadHoraFin'),
    lugar: document.getElementById('actividadLugar'),
    residente: document.getElementById('actividadResidenteId'),
  };
}

function setFormMode(mode) {
  const { title, submitButton } = getFormElements();
  if (title) {
    title.textContent = mode === 'edit' ? 'Editar actividad' : 'Nueva actividad';
  }
  if (submitButton) {
    submitButton.textContent = mode === 'edit' ? 'Actualizar' : 'Confirmar';
  }
}

function resetFormState() {
  const { form, residente } = getFormElements();
  if (form) {
    form.reset();
  }

  if (residente) {
    residente.value = '1';
  }

  actividadEditandoId = null;
  setFormMode('create');
}

function closeForm() {
  const { panel } = getFormElements();
  resetFormState();

  if (panel) {
    panel.style.display = 'none';
  }
}

function openForm() {
  const { panel, nombre } = getFormElements();
  if (panel) {
    panel.style.display = 'block';
  }

  if (!actividadEditandoId) {
    setFormMode('create');
  }

  if (nombre) {
    nombre.focus();
  }
}

function toggleForm(forceOpen) {
  if (!canManageActividades()) {
    return;
  }

  const { panel } = getFormElements();
  if (!panel) {
    return;
  }

  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.style.display !== 'block';
  if (shouldOpen) {
    openForm();
  } else {
    closeForm();
  }
}

function buildPayload() {
  const { nombre, fecha, horaInicio, horaFin, lugar, residente } = getFormElements();

  return {
    Nombre: String(nombre?.value ?? '').trim(),
    Fecha: String(fecha?.value ?? '').trim(),
    Hora_ini: String(horaInicio?.value ?? '').trim(),
    Hora_fin: String(horaFin?.value ?? '').trim(),
    Lugar: String(lugar?.value ?? '').trim(),
    cod_residente: Number.parseInt(String(residente?.value ?? '').trim(), 10),
  };
}

function validatePayload(payload) {
  const errors = [];

  if (!payload.Nombre) {
    errors.push('El nombre de la actividad es obligatorio.');
  } else if (payload.Nombre.length > 50) {
    errors.push('El nombre de la actividad no puede superar 50 caracteres.');
  }

  if (!payload.Fecha) {
    errors.push('La fecha de la actividad es obligatoria.');
  }

  if (!payload.Hora_ini) {
    errors.push('La hora de inicio es obligatoria.');
  }

  if (!payload.Hora_fin) {
    errors.push('La hora de fin es obligatoria.');
  }

  if (payload.Hora_ini && payload.Hora_fin && payload.Hora_fin <= payload.Hora_ini) {
    errors.push('La hora de fin debe ser posterior a la hora de inicio.');
  }

  if (!payload.Lugar) {
    errors.push('El lugar de la actividad es obligatorio.');
  } else if (payload.Lugar.length > 50) {
    errors.push('El lugar de la actividad no puede superar 50 caracteres.');
  }

  if (!Number.isInteger(payload.cod_residente) || payload.cod_residente <= 0) {
    errors.push('El código del residente debe ser un número válido mayor que cero.');
  }

  return errors;
}

async function notify(type, message, title) {
  const alerts = window.HgaAlerts;
  if (!alerts || typeof alerts[type] !== 'function') {
    window.alert(message);
    return;
  }

  await alerts[type](message, title);
}

function getSearchText(activity) {
  return [
    activity.id,
    activity.nombre,
    parseDateForDisplay(activity.fecha),
    activity.horaInicio,
    activity.horaFin,
    activity.lugar,
    activity.codResidente,
  ].join(' ').toLowerCase();
}

function renderActividades(items) {
  const { lista } = getFormElements();
  if (!lista) {
    return;
  }

  lista.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted mb-0">No hay actividades registradas.</p>';
    return;
  }

  const filtered = currentFilter
    ? items.filter((actividad) => getSearchText(actividad).includes(currentFilter))
    : items;

  if (filtered.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted mb-0">No hay coincidencias para la búsqueda.</p>';
    return;
  }

  filtered.forEach((actividad) => {
    const card = document.createElement('div');
    card.className = 'card-informe';
    card.dataset.id = actividad.id;
    const actionsMarkup = canManageActividades()
      ? `
      <div class="mt-2">
        <button type="button" class="btn btn-sm btn-info btn-editar">Editar</button>
        <button type="button" class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
      </div>
    `
      : '';
    card.innerHTML = `
      <strong>${escapeHtml(actividad.nombre || 'Sin nombre')}</strong><br>
      <small>Código: ${escapeHtml(actividad.id || '---')}</small><br>
      <small>${escapeHtml(parseDateForDisplay(actividad.fecha))} ${escapeHtml(actividad.horaInicio || '')} - ${escapeHtml(actividad.horaFin || '')}</small><br>
      <span>Lugar: ${escapeHtml(actividad.lugar || '---')}</span><br>
      <span>Residente: ${escapeHtml(String(actividad.codResidente || '---'))}</span><br>
      ${actionsMarkup}
    `;

    const editarButton = card.querySelector('.btn-editar');
    const eliminarButton = card.querySelector('.btn-eliminar');

    editarButton?.addEventListener('click', () => editarActividad(actividad));
    eliminarButton?.addEventListener('click', () => eliminarActividad(actividad.id));

    lista.appendChild(card);
  });
}

async function cargarActividades() {
  const { lista } = getFormElements();
  if (lista) {
    lista.innerHTML = '<p class="text-center text-muted mb-0">Cargando actividades...</p>';
  }

  try {
    const data = await requestJson(API_BASE, {
      method: 'GET',
      headers: buildHeaders(false),
    });

    actividadesCache = Array.isArray(data.data) ? data.data.map(normalizeActividad) : [];
    renderActividades(actividadesCache);
  } catch (error) {
    if (error.message === 'Sesion expirada') {
      return;
    }

    console.error('Error en cargarActividades:', error);
    if (lista) {
      lista.innerHTML = '<p class="text-center text-danger mb-0">No se pudieron cargar las actividades.</p>';
    }
    await notify('error', `No se pudo cargar actividades: ${error.message}`);
  }
}

async function crearActividad(payload) {
  return requestJson(API_BASE, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

async function actualizarActividad(id, payload) {
  return requestJson(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

async function eliminarActividad(id) {
  if (!id) {
    await notify('warning', 'La actividad no tiene un identificador válido.', 'No se puede eliminar');
    return;
  }

  const confirmacion = window.HgaAlerts?.confirm
    ? await window.HgaAlerts.confirm('¿Eliminar esta actividad lúdica?', 'Eliminar actividad')
    : window.confirm('¿Eliminar esta actividad lúdica?');
  if (!confirmacion) {
    return;
  }

  try {
    await requestJson(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(false),
    });

    await notify('success', 'Actividad eliminada.');
    await cargarActividades();
  } catch (error) {
    if (error.message === 'Sesion expirada') {
      return;
    }

    console.error('Error eliminarActividad:', error);
    await notify('error', `No se pudo eliminar: ${error.message}`);
  }
}

function editarActividad(actividad) {
  const { nombre, fecha, horaInicio, horaFin, lugar, residente } = getFormElements();
  actividadEditandoId = actividad.id;
  setFormMode('edit');

  if (nombre) nombre.value = actividad.nombre || '';
  if (fecha) fecha.value = formatDateForInput(actividad.fecha);
  if (horaInicio) horaInicio.value = formatTimeForInput(actividad.horaInicio);
  if (horaFin) horaFin.value = formatTimeForInput(actividad.horaFin);
  if (lugar) lugar.value = actividad.lugar || '';
  if (residente) residente.value = actividad.codResidente > 0 ? String(actividad.codResidente) : '1';

  openForm();
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!canManageActividades()) {
    return;
  }

  if (isSubmitting) {
    return;
  }

  const payload = buildPayload();
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    await notify('warning', errors.join('\n'), 'Corrige los datos');
    return;
  }

  isSubmitting = true;
  const { submitButton } = getFormElements();
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    if (actividadEditandoId) {
      await actualizarActividad(actividadEditandoId, payload);
      await notify('success', 'Actividad actualizada.');
    } else {
      await crearActividad(payload);
      await notify('success', 'Actividad creada.');
    }

    closeForm();
    await cargarActividades();
  } catch (error) {
    if (error.message !== 'Sesion expirada') {
      console.error('Error al guardar actividad:', error);
      await notify('error', `No se pudo guardar la actividad: ${error.message}`);
    }
  } finally {
    isSubmitting = false;
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function filtrarActividades() {
  const { filterInput } = getFormElements();
  currentFilter = String(filterInput?.value ?? '').trim().toLowerCase();
  renderActividades(actividadesCache);
}

function bindEvents() {
  const { form, discardButton, filterInput } = getFormElements();

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  if (discardButton) {
    discardButton.addEventListener('click', (event) => {
      event.preventDefault();
      closeForm();
    });
  }

  if (filterInput) {
    filterInput.addEventListener('input', filtrarActividades);
  }
}

function applyRoleMode() {
  const { panel } = getFormElements();
  const newButton = document.querySelector('.btn-nuevo-container');
  const canManage = canManageActividades();

  if (newButton instanceof HTMLElement) {
    newButton.hidden = !canManage;
  }

  if (panel instanceof HTMLElement && !canManage) {
    panel.style.display = 'none';
  }
}

async function init() {
  if (!getStoredToken()) {
    window.location.href = LOGIN_URL;
    return;
  }

  const { panel } = getFormElements();
  if (panel) {
    panel.style.display = 'none';
  }

  applyRoleMode();
  bindEvents();
  await cargarActividades();
}

window.toggleForm = toggleForm;
window.filtrarActividades = filtrarActividades;
window.filtrar = filtrarActividades;

document.addEventListener('DOMContentLoaded', init);
