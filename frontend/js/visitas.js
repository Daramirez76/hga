// Gestión de Visitas (fetch + AJAX)
const VISITAS_API_URL = `${window.location.origin}/api/visitas`;

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

let formulario, listaVisitas;
let codVisitas, docId, nombVisitante, codResidente, fechaVisita, hora, codUsuario, descripcionVisita;

function toggleForm() {
  const panel = document.getElementById('formPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function limpiarFormulario() {
  formulario.reset();
}

function validarCampos() {
  const errores = [];
  if (!codVisitas.value || isNaN(codVisitas.value)) errores.push('cod_Visitas es obligatorio y numérico.');
  if (!docId.value || isNaN(docId.value)) errores.push('doc_id es obligatorio y numérico.');
  if (!nombVisitante.value.trim()) errores.push('Nomb_visitante es obligatorio.');
  if (!codResidente.value || isNaN(codResidente.value)) errores.push('cod_Residente es obligatorio y numérico.');
  if (!fechaVisita.value) errores.push('Fecha_Visita es obligatoria.');
  if (!hora.value) errores.push('Hora es obligatoria.');
  if (!codUsuario.value || isNaN(codUsuario.value)) errores.push('cod_usuario es obligatorio y numérico.');

  const fecha = new Date(fechaVisita.value);
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  if (fecha < hoy) errores.push('La fecha no puede ser en el pasado.');

  return errores;
}

async function cargarVisitas() {
  try {
    const response = await fetch(VISITAS_API_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const datos = await response.json();
    if (!response.ok) throw new Error(datos.message || `Error HTTP ${response.status}`);

    listaVisitas.innerHTML = '';

    if (!Array.isArray(datos.data) || datos.data.length === 0) {
      listaVisitas.innerHTML = '<p>No hay visitas registradas.</p>';
      return;
    }

    datos.data.forEach(visita => {
      const item = document.createElement('div');
      item.className = 'card-informe';
      const fecha = visita.Fecha_Visita ? new Date(visita.Fecha_Visita).toLocaleDateString('es-ES') : '---';
      item.innerHTML = `
        <strong>${visita.Nomb_visitante || 'Sin nombre'}</strong><br>
        <small>Documento: ${visita.doc_id || '---'} | Residente: ${visita.cod_Residente || '---'} | Usuario: ${visita.cod_usuario || '---'}</small><br>
        <small>${fecha} ${visita.Hora || ''}</small><br>
        <p>${visita.descripcion || ''}</p>
        <div class="mt-2">
          <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
        </div>
      `;
      const btnEliminar = item.querySelector('.btn-eliminar');
      btnEliminar.addEventListener('click', () => eliminarVisita(visita.id));
      listaVisitas.appendChild(item);
    });

  } catch (error) {
    console.error('Error cargarVisitas:', error);
    listaVisitas.innerHTML = '<p>Error al cargar visitas. Revisa la consola.</p>';
  }
}

async function crearVisita(event) {
  event.preventDefault();

  const errores = validarCampos();
  if (errores.length > 0) {
    await window.HgaAlerts.warning(errores.join('\n'), 'Corrige los datos');
    return;
  }

  const body = {
    cod_Visitas: parseInt(codVisitas.value, 10),
    doc_id: parseInt(docId.value, 10),
    Nomb_visitante: nombVisitante.value.trim(),
    cod_Residente: parseInt(codResidente.value, 10),
    Fecha_Visita: fechaVisita.value,
    cod_usuario: parseInt(codUsuario.value, 10),
    Hora: hora.value,
    descripcion: descripcionVisita.value.trim(),
  };

  try {
    const response = await fetch(VISITAS_API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const datos = await response.json();
    if (!response.ok) throw new Error(datos.message || `Error HTTP ${response.status}`);

    await window.HgaAlerts.success('Visita registrada correctamente.');
    limpiarFormulario();
    await cargarVisitas();
    toggleForm();

  } catch (error) {
    console.error('Error crearVisita:', error);
    await window.HgaAlerts.error('No se pudo registrar la visita: ' + error.message);
  }
}

async function eliminarVisita(id) {
  const confirmacion = await window.HgaAlerts.confirm('¿Seguro que quieres eliminar esta visita?', 'Eliminar visita');
  if (!confirmacion) return;

  try {
    const response = await fetch(`${VISITAS_API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const datos = await response.json();
    if (!response.ok) throw new Error(datos.message || `Error HTTP ${response.status}`);

    await window.HgaAlerts.success('Visita eliminada.');
    await cargarVisitas();

  } catch (error) {
    console.error('Error eliminarVisita:', error);
    await window.HgaAlerts.error('No se pudo eliminar la visita: ' + error.message);
  }
}

function diferenciarFiltro() {
  const query = document.getElementById('filtro').value.toLowerCase();
  document.querySelectorAll('#listaVisitasContainer .card-informe').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(query) ? 'block' : 'none';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  formulario = document.getElementById('formNuevaVisita');
  listaVisitas = document.getElementById('listaVisitasContainer');

  codVisitas = document.getElementById('codVisitas');
  docId = document.getElementById('docId');
  nombVisitante = document.getElementById('nombVisitante');
  codResidente = document.getElementById('codResidente');
  fechaVisita = document.getElementById('fechaVisita');
  hora = document.getElementById('hora');
  codUsuario = document.getElementById('codUsuario');
  descripcionVisita = document.getElementById('descripcionVisita');

  formulario.addEventListener('submit', crearVisita);

  const inputFiltro = document.getElementById('filtro');
  if (inputFiltro) inputFiltro.addEventListener('keyup', diferenciarFiltro);

  cargarVisitas();
});
