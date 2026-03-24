// Gestión de Actividades Lúdicas con Fetch (AJAX)
const API_BASE = window.location.origin + '/api/actividades';
let actividadEditandoId = null;

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function toggleForm() {
  const panel = document.getElementById('formPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function limpiarFormulario() {
  document.getElementById('actividadFecha').value = '';
  document.getElementById('actividadHoraInicio').value = '';
  document.getElementById('actividadHoraFin').value = '';
  document.getElementById('actividadNombre').value = '';
  document.getElementById('actividadParticipantes').value = '';
  document.getElementById('actividadLugar').value = '';
  document.getElementById('actividadResidenteId').value = '1';
  document.getElementById('actividadDescripcion').value = '';
  actividadEditandoId = null;
  document.querySelector('#formPanel h6').textContent = 'Nueva Actividad';
}

function obtenerDatosFormulario() {
  return {
    Nombre: document.getElementById('actividadNombre').value.trim(),
    Fecha: document.getElementById('actividadFecha').value,
    Hora_ini: document.getElementById('actividadHoraInicio').value,
    Hora_fin: document.getElementById('actividadHoraFin').value,
    Lugar: document.getElementById('actividadLugar').value.trim() || 'No especificado',
    cod_residente: parseInt(document.getElementById('actividadResidenteId').value, 10) || 1,
    cod_rol: 2,
    descripcion: document.getElementById('actividadDescripcion').value.trim(),
  };
}

function validarFormulario(datos) {
  const errores = [];
  if (!datos.Nombre) errores.push('Nombre es obligatorio.');
  if (!datos.Fecha) errores.push('Fecha es obligatoria.');
  if (!datos.Hora_ini) errores.push('Hora de inicio es obligatoria.');
  if (!datos.Hora_fin) errores.push('Hora de fin es obligatoria.');
  if (!datos.Lugar) errores.push('Lugar es obligatorio.');
  if (!datos.cod_residente || isNaN(datos.cod_residente)) errores.push('Código de residente válido es obligatorio.');
  return errores;
}

function mostrarError(mensaje) {
  alert(`❌ ${mensaje}`);
}

function mostrarExito(mensaje) {
  alert(`✅ ${mensaje}`);
}

async function cargarActividades() {
  try {
    const res = await fetch(API_BASE, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Error HTTP ${res.status}`);
    renderizarActividades(data.data || []);
  } catch (err) {
    console.error('Error en cargarActividades:', err);
    mostrarError('No se pudo cargar actividades: ' + err.message);
  }
}

function renderizarActividades(actividades) {
  const lista = document.getElementById('lista');
  if (!lista) return;
  lista.innerHTML = '';
  if (!Array.isArray(actividades) || actividades.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted">No hay actividades registradas.</p>';
    return;
  }

  actividades.forEach(act => {
    const card = document.createElement('div');
    card.className = 'card-informe';
    card.dataset.id = act.id;
    const fechaFormateada = new Date(act.Fecha).toLocaleDateString('es-ES');
    card.innerHTML = `
      <strong>${act.Nombre || 'Sin nombre'}</strong><br>
      <small>${fechaFormateada} ${act.Hora_ini || ''} - ${act.Hora_fin || ''}</small><br>
      <span>${act.Lugar || ''}</span><br>
      <span>Residente: ${act.cod_residente || '-'}</span><br>
      <div class="mt-2">
        <button class="btn btn-sm btn-info btn-editar">Editar</button>
        <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
      </div>
    `;
    card.querySelector('.btn-eliminar').addEventListener('click', () => eliminarActividad(act.id));
    card.querySelector('.btn-editar').addEventListener('click', () => editarActividad(act));
    lista.appendChild(card);
  });
}

async function crearActividad(datos) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Error HTTP ${response.status}`);
    return data.data;
  } catch (err) {
    console.error('Error crearActividad:', err);
    throw err;
  }
}

async function actualizarActividad(id, datos) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Error HTTP ${response.status}`);
    return data.data;
  } catch (err) {
    console.error('Error actualizarActividad:', err);
    throw err;
  }
}

async function eliminarActividad(id) {
  if (!confirm('¿Eliminar actividad?')) return;
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Error HTTP ${response.status}`);
    mostrarExito('Actividad eliminada.');
    await cargarActividades();
  } catch (err) {
    console.error('Error eliminarActividad:', err);
    mostrarError('No se pudo eliminar: ' + err.message);
  }
}

function editarActividad(actividad) {
  actividadEditandoId = actividad.id;
  document.querySelector('#formPanel h6').textContent = 'Editar Actividad';
  document.getElementById('actividadFecha').value = actividad.Fecha || '';
  document.getElementById('actividadHoraInicio').value = actividad.Hora_ini || '';
  document.getElementById('actividadHoraFin').value = actividad.Hora_fin || '';
  document.getElementById('actividadNombre').value = actividad.Nombre || '';
  document.getElementById('actividadParticipantes').value = actividad.Participantes || '';
  document.getElementById('actividadLugar').value = actividad.Lugar || '';
  document.getElementById('actividadResidenteId').value = actividad.cod_residente || 1;
  document.getElementById('actividadDescripcion').value = actividad.descripcion || '';
  document.getElementById('formPanel').style.display = 'block';
}

async function onConfirmarActividad() {
  const datos = obtenerDatosFormulario();
  const errores = validarFormulario(datos);
  if (errores.length) {
    mostrarError(errores.join('\n'));
    return;
  }

  try {
    if (actividadEditandoId) {
      await actualizarActividad(actividadEditandoId, datos);
      mostrarExito('Actividad actualizada.');
    } else {
      await crearActividad(datos);
      mostrarExito('Actividad creada.');
    }
    limpiarFormulario();
    toggleForm();
    await cargarActividades();
  } catch (err) {
    mostrarError(err.message);
  }
}

function filtrarActividades() {
  const valor = document.getElementById('filtro').value.toLowerCase();
  document.querySelectorAll('#lista .card-informe').forEach(el => {
    const texto = el.textContent.toLowerCase();
    el.style.display = texto.includes(valor) ? 'block' : 'none';
  });
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', function () {
  cargarActividades();

  document.getElementById('filtro').addEventListener('keyup', filtrarActividades);

  const btnConfirmar = document.querySelector('.btn-confirmar');
  if (btnConfirmar) btnConfirmar.addEventListener('click', onConfirmarActividad);

  const btnDescartar = document.querySelector('#formPanel .btn-secondary');
  if (btnDescartar) {
    btnDescartar.addEventListener('click', (e) => {
      e.preventDefault();
      limpiarFormulario();
      toggleForm();
    });
  }
});
