// Gestión de Informes - informes.js (AJAX con fetch)
const INFORMES_API_URL = `${window.location.origin}/api/informes`;

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

let buscador = null;
let listaInformes = null;
let botonNuevo = null;
let todosList = [];

let inputCodigo = null;
let inputDoc = null;
let inputResidente = null;
let inputTitulo = null;
let inputRol = null;
let botonGuardar = null;

async function cargarInformes() {
  try {
    const res = await fetch(INFORMES_API_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const datos = await res.json();
    if (!res.ok) throw new Error(datos.message || `Error HTTP ${res.status}`);

    todosList = Array.isArray(datos.data) ? datos.data : [];
    mostrarListaCompleta();

  } catch (error) {
    console.error('Error cargarInformes:', error);
    if (listaInformes) listaInformes.innerHTML = '<p>Error al cargar informes.</p>';
  }
}

function renderInforme(informe) {
  const li = document.createElement('div');
  li.className = 'card-informe';
  li.innerHTML = `
    <h6>${informe.Titulo_Informes || 'Sin título'}</h6>
    <p>Residente: ${informe.cod_Residente || '-'} | Código: ${informe.cod_Informes || '-'}</p>
    <small>Usuario: ${informe.cod_rol || '-'} | Documento: ${informe.doc_id || '-'}</small>
    <div class="mt-2">
      <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
      <button class="btn btn-sm btn-info btn-editar">Editar</button>
    </div>
  `;

  li.querySelector('.btn-eliminar').addEventListener('click', () => eliminarInforme(informe.id));
  li.querySelector('.btn-editar').addEventListener('click', () => editarInforme(informe));

  return li;
}

function mostrarListaCompleta() {
  if (!listaInformes) return;
  listaInformes.innerHTML = '';

  if (todosList.length === 0) {
    listaInformes.innerHTML = '<p>No hay informes.</p>';
    return;
  }

  todosList.forEach(informe => {
    listaInformes.appendChild(renderInforme(informe));
  });
}

function buscarInformes() {
  const termino = buscador?.value.toLowerCase?.() || '';
  const encontrados = todosList.filter(informe => {
    const titulo = (informe.Titulo_Informes || '').toLowerCase();
    const codigo = String(informe.cod_Informes || '');
    const residente = String(informe.cod_Residente || '');
    return titulo.includes(termino) || codigo.includes(termino) || residente.includes(termino);
  });

  if (!listaInformes) return;
  listaInformes.innerHTML = '';
  if (encontrados.length === 0) {
    listaInformes.innerHTML = '<p>No hay resultados.</p>';
    return;
  }
  encontrados.forEach(informe => listaInformes.appendChild(renderInforme(informe)));
}

async function guardarInforme() {
  if (!inputCodigo.value || !inputDoc.value || !inputResidente.value || !inputTitulo.value || !inputRol.value) {
    alert('❌ Completa todos los campos');
    return;
  }

  botonGuardar.disabled = true;
  botonGuardar.textContent = 'Guardando...';

  const payload = {
    cod_Informes: parseInt(inputCodigo.value, 10),
    doc_id: parseInt(inputDoc.value, 10),
    cod_Residente: parseInt(inputResidente.value, 10),
    Titulo_Informes: inputTitulo.value.trim(),
    cod_rol: parseInt(inputRol.value, 10),
  };

  try {
    const res = await fetch(INFORMES_API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const datos = await res.json();
    if (!res.ok) throw new Error(datos.message || `Error HTTP ${res.status}`);

    alert('✅ Informe creado');

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalInforme'));
    if (modal) modal.hide();

    cargarInformes();

  } catch (error) {
    console.error('Error guardarInforme:', error);
    alert('❌ Error al crear informe: ' + error.message);

  } finally {
    botonGuardar.disabled = false;
    botonGuardar.textContent = 'Guardar';
  }
}

async function eliminarInforme(id) {
  if (!confirm('¿Seguro deseas eliminar el informe?')) return;

  try {
    const res = await fetch(`${INFORMES_API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const datos = await res.json();
    if (!res.ok) throw new Error(datos.message || `Error HTTP ${res.status}`);

    alert('✅ Informe eliminado');
    cargarInformes();

  } catch (error) {
    console.error('Error eliminarInforme:', error);
    alert('❌ No se pudo eliminar el informe: ' + error.message);
  }
}

function editarInforme(informe) {
  // Rellenar modal para edición (a modo simple, no implementado PUT completo)
  inputCodigo.value = informe.cod_Informes || '';
  inputDoc.value = informe.doc_id || '';
  inputResidente.value = informe.cod_Residente || '';
  inputTitulo.value = informe.Titulo_Informes || '';
  inputRol.value = informe.cod_rol || '';

  const modal = new bootstrap.Modal(document.getElementById('modalInforme'));
  modal.show();

  botonGuardar.textContent = 'Actualizar';

  // Reasignar evento para actualizar (simple placeholder)
  botonGuardar.onclick = async function() {
    try {
      const res = await fetch(`${INFORMES_API_URL}/${informe.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cod_Informes: parseInt(inputCodigo.value, 10),
          doc_id: parseInt(inputDoc.value, 10),
          cod_Residente: parseInt(inputResidente.value, 10),
          Titulo_Informes: inputTitulo.value.trim(),
          cod_rol: parseInt(inputRol.value, 10),
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.message || `Error HTTP ${res.status}`);
      alert('✅ Informe actualizado');
      modal.hide();
      cargarInformes();
    } catch (error) {
      console.error('Error actualizar informe:', error);
      alert('❌ No se pudo actualizar: ' + error.message);
    } finally {
      botonGuardar.textContent = 'Guardar';
      botonGuardar.onclick = guardarInforme;
    }
  };
}

function crearModal() {
  const html = `
        <div class="modal fade" id="modalInforme" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>Crear Informe</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formInforme">
                            <div class="mb-3">
                                <label>Codigo Informe</label>
                                <input type="number" class="form-control" id="inputCodigo" required>
                            </div>
                            <div class="mb-3">
                                <label>Documento</label>
                                <input type="number" class="form-control" id="inputDoc" required>
                            </div>
                            <div class="mb-3">
                                <label>Codigo Residente</label>
                                <input type="number" class="form-control" id="inputResidente" required>
                            </div>
                            <div class="mb-3">
                                <label>Titulo</label>
                                <input type="text" class="form-control" id="inputTitulo" maxlength="255" required>
                            </div>
                            <div class="mb-3">
                                <label>Codigo Rol</label>
                                <input type="number" class="form-control" id="inputRol" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btnGuardarInforme">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML('beforeend', html);

  inputCodigo = document.getElementById('inputCodigo');
  inputDoc = document.getElementById('inputDoc');
  inputResidente = document.getElementById('inputResidente');
  inputTitulo = document.getElementById('inputTitulo');
  inputRol = document.getElementById('inputRol');
  botonGuardar = document.getElementById('btnGuardarInforme');

  botonGuardar.addEventListener('click', guardarInforme);
}

function mostrarModal() {
  const modal = new bootstrap.Modal(document.getElementById('modalInforme'));
  modal.show();
}

document.addEventListener('DOMContentLoaded', function() {
  buscador = document.getElementById('searchInformes');
  listaInformes = document.getElementById('listaInformesContainer');
  botonNuevo = document.getElementById('btnNuevoInforme');

  if (buscador) buscador.addEventListener('input', buscarInformes);
  if (botonNuevo) botonNuevo.addEventListener('click', mostrarModal);

  crearModal();
  cargarInformes();
});
