// Gestión de Informes - informes.js

let buscador = null;
let listaInformes = null;
let botonNuevo = null;
let todosList = [];

// Inputs del modal
let inputCodigo = null;
let inputDoc = null;
let inputResidente = null;
let inputTitulo = null;
let inputRol = null;
let botonGuardar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos
    buscador = document.getElementById('searchInformes');
    listaInformes = document.getElementById('listaInformesContainer');
    botonNuevo = document.getElementById('btnNuevoInforme');
    
    // Evento para buscar
    if (buscador) {
        buscador.addEventListener('input', buscarInformes);
    }
    
    // Evento para nuevo informe
    if (botonNuevo) {
        botonNuevo.addEventListener('click', mostrarModal);
    }
    
    // Crear modal
    crearModal();
    
    // Cargar informes
    cargarInformes();
});

// Cargar informes del servidor
function cargarInformes() {
    fetch('/api/informes', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(respuesta => respuesta.json())
    .then(datos => {
        if (datos.data && datos.data.length > 0) {
            todosList = datos.data;
            mostrarListaCompleta();
        } else {
            listaInformes.innerHTML = '<li>No hay informes.</li>';
        }
    })
    .catch(error => {
        console.log('Error:', error);
        listaInformes.innerHTML = '<li>Error al cargar informes.</li>';
    });
}

// Mostrar lista completa
function mostrarListaCompleta() {
    listaInformes.innerHTML = '';
    
    todosList.forEach(informe => {
        let li = document.createElement('li');
        li.innerHTML = '<strong>' + informe.Titulo_Informes + '</strong><br>' +
                      '<small>Residente: ' + informe.cod_Residente + ' | Código: ' + informe.cod_Informes + '</small>';
        listaInformes.appendChild(li);
    });
}

// Buscar informes
function buscarInformes() {
    let termino = buscador.value.toLowerCase();
    listaInformes.innerHTML = '';
    
    let encontrados = todosList.filter(informe => {
        let titulo = informe.Titulo_Informes.toLowerCase();
        let codigo = informe.cod_Informes.toString();
        let residente = informe.cod_Residente.toString();
        
        return titulo.includes(termino) || codigo.includes(termino) || residente.includes(termino);
    });
    
    if (encontrados.length == 0) {
        listaInformes.innerHTML = '<li>No hay resultados.</li>';
        return;
    }
    
    encontrados.forEach(informe => {
        let li = document.createElement('li');
        li.innerHTML = '<strong>' + informe.Titulo_Informes + '</strong><br>' +
                      '<small>Residente: ' + informe.cod_Residente + ' | Código: ' + informe.cod_Informes + '</small>';
        listaInformes.appendChild(li);
    });
}

// Crear modal
function crearModal() {
    let html = `
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
                                <label>Código Informe</label>
                                <input type="number" class="form-control" id="inputCodigo" required>
                            </div>
                            <div class="mb-3">
                                <label>Documento</label>
                                <input type="number" class="form-control" id="inputDoc" required>
                            </div>
                            <div class="mb-3">
                                <label>Código Residente</label>
                                <input type="number" class="form-control" id="inputResidente" required>
                            </div>
                            <div class="mb-3">
                                <label>Título</label>
                                <input type="text" class="form-control" id="inputTitulo" maxlength="50" required>
                            </div>
                            <div class="mb-3">
                                <label>Código Rol</label>
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
    
    // Obtener referencias
    inputCodigo = document.getElementById('inputCodigo');
    inputDoc = document.getElementById('inputDoc');
    inputResidente = document.getElementById('inputResidente');
    inputTitulo = document.getElementById('inputTitulo');
    inputRol = document.getElementById('inputRol');
    botonGuardar = document.getElementById('btnGuardarInforme');
    
    // Evento del botón guardar
    botonGuardar.addEventListener('click', guardarInforme);
}

// Mostrar modal
function mostrarModal() {
    let modal = new bootstrap.Modal(document.getElementById('modalInforme'));
    modal.show();
}

// Guardar informe
function guardarInforme() {
    // Validar
    if (!inputCodigo.value || !inputDoc.value || !inputResidente.value || !inputTitulo.value || !inputRol.value) {
        alert('❌ Completa todos los campos');
        return;
    }
    
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando...';
    
    // Preparar datos
    let datos = {
        cod_Informes: parseInt(inputCodigo.value),
        doc_id: parseInt(inputDoc.value),
        cod_Residente: parseInt(inputResidente.value),
        Titulo_Informes: inputTitulo.value,
        cod_rol: parseInt(inputRol.value)
    };
    
    // Enviar
    fetch('/api/informes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(respuesta => respuesta.json())
    .then(datos => {
        alert('✅ Informe creado');
        
        // Cerrar modal
        let modal = bootstrap.Modal.getInstance(document.getElementById('modalInforme'));
        modal.hide();
        
        // Recargar
        setTimeout(() => {
            cargarInformes();
            botonGuardar.disabled = false;
            botonGuardar.textContent = 'Guardar';
        }, 1500);
    })
    .catch(error => {
        alert('❌ Error al crear informe');
        console.log(error);
        botonGuardar.disabled = false;
        botonGuardar.textContent = 'Guardar';
    });
}
