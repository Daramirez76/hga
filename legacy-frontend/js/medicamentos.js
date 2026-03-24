// Gestión de Medicamentos con AJAX
document.addEventListener('DOMContentLoaded', function() {
  const btnGestionarMedicamentos = document.querySelector('.btn-gestionar');
  
  // Cargar medicamentos al iniciar
  cargarMedicamentos();
  
  // Event listener para gestionar medicamentos
  if (btnGestionarMedicamentos) {
    btnGestionarMedicamentos.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalNuevoMedicamento();
    });
  }
});

/**
 * Cargar todos los medicamentos desde el backend
 */
async function cargarMedicamentos() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('http://localhost:8000/api/medicamentos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    console.log('Medicamentos cargados:', data.data);
    renderizarMedicamentos(data.data);
    
  } catch (error) {
    console.error('Error al cargar medicamentos:', error);
    mostrarError(`No se pudieron cargar los medicamentos: ${error.message}`);
  }
}

/**
 * Renderizar medicamentos en los tres slots del DOM
 */
function renderizarMedicamentos(medicamentos) {
  if (!medicamentos || medicamentos.length === 0) {
    mostrarMensajeVacio();
    return;
  }
  
  // Obtener los slots
  const slots = document.querySelectorAll('.inner-slot');
  
  if (slots.length < 3) {
    console.warn('No se encontraron los 3 slots esperados');
    return;
  }
  
  // Dividir medicamentos en tres categorías
  const medicamentosActivos = medicamentos.filter(m => !estaVencido(m.fecha_vencimiento));
  const medicamentosVencidos = medicamentos.filter(m => estaVencido(m.fecha_vencimiento));
  const medicamentosEntregados = medicamentos.filter(m => m.stock === 0);
  
  // Renderizar en cada slot
  slots[0].innerHTML = crearListaMedicamentos(medicamentosActivos, 'Medicamentos Activos');
  slots[1].innerHTML = crearTablaEntregas(medicamentos);
  slots[2].innerHTML = crearListaNovedades(medicamentosVencidos);
}

/**
 * Verificar si un medicamento está vencido
 */
function estaVencido(fechaVencimiento) {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  return vencimiento < hoy;
}

/**
 * Crear lista HTML de medicamentos
 */
function crearListaMedicamentos(medicamentos, titulo) {
  if (medicamentos.length === 0) {
    return `<div class="text-center"><p class="text-muted">No hay ${titulo.toLowerCase()}</p></div>`;
  }
  
  let html = `<h6 class="fw-bold mb-3">${titulo}</h6>`;
  html += '<div class="list-group">';
  
  medicamentos.forEach(med => {
    const diasVencimiento = calcularDiasVencimiento(med.fecha_vencimiento);
    const alerta = diasVencimiento <= 30 ? '⚠️' : '✓';
    
    html += `
      <div class="list-group-item p-2 mb-2 rounded" style="background: rgba(230, 245, 232, 0.5); border: 1px solid rgba(102, 187, 106, 0.2);">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${med.nombre_medic}</strong>
            <div><small class="text-muted">Código: ${med.cod_medicamento}</small></div>
            <div><small class="text-muted">Stock: ${med.stock}</small></div>
          </div>
          <div class="text-end">
            <span class="badge ${diasVencimiento <= 30 ? 'bg-warning' : 'bg-success'}">${alerta}</span>
            <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarMedicamento(${med.id})">×</button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Crear tabla de entregas
 */
function crearTablaEntregas(medicamentos) {
  if (medicamentos.length === 0) {
    return '<p class="text-muted text-center">No hay entregas registradas</p>';
  }
  
  let html = '<h6 class="fw-bold mb-3">Registro de Entregas</h6>';
  html += '<div style="max-height: 280px; overflow-y: auto;"><table class="table table-sm table-hover">';
  html += '<thead><tr><th>Medicamento</th><th>Stock</th><th>Acción</th></tr></thead><tbody>';
  
  medicamentos.slice(0, 8).forEach(med => {
    html += `
      <tr>
        <td><small>${med.nombre_medic}</small></td>
        <td><small>${med.stock}</small></td>
        <td>
          <button class="btn btn-sm btn-primary btn-sm" onclick="registrarEntrega(${med.id})">Registrar</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

/**
 * Crear lista de novedades
 */
function crearListaNovedades(medicamentosVencidos) {
  if (medicamentosVencidos.length === 0) {
    return '<p class="text-muted text-center">✓ Sin novedades críticas</p>';
  }
  
  let html = '<h6 class="fw-bold text-danger mb-3">⚠️ Novedades Críticas</h6>';
  html += '<div>';
  
  medicamentosVencidos.forEach(med => {
    html += `
      <div class="alert alert-warning p-2 mb-2" role="alert">
        <small>
          <strong>${med.nombre_medic}</strong><br>
          Vencido: ${formatearFecha(med.fecha_vencimiento)}<br>
          Novedad: ${med.descrip_novedad || 'Sin descripción'}
        </small>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Calcular días hasta vencimiento
 */
function calcularDiasVencimiento(fechaVencimiento) {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diferencia = vencimiento - hoy;
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return dias;
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
  const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

/**
 * Mostrar mensaje vacío
 */
function mostrarMensajeVacio() {
  const slots = document.querySelectorAll('.inner-slot');
  slots.forEach(slot => {
    slot.innerHTML = '<p class="text-muted">No hay medicamentos disponibles</p>';
  });
}

/**
 * Abre modal para crear nuevo medicamento
 */
function abrirModalNuevoMedicamento() {
  alert('Se implementará un modal completo para agregar medicamentos\n\nCampos requeridos:\n- Nombre\n- Fecha entrada (YYYY-MM-DD)\n- Fecha vencimiento (YYYY-MM-DD)\n- Stock\n- Descripción de novedad (opcional)');
}

/**
 * Registrar entrega de medicamento
 */
async function registrarEntrega(id) {
  const cantidad = prompt('¿Cuántas unidades se entregan?');
  
  if (!cantidad) return;
  
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:8000/api/medicamentos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        stock: parseInt(cantidad),
        fecha_novedad: new Date().toISOString().split('T')[0],
        descrip_novedad: `Entrega de ${cantidad} unidades`
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    alert('✅ Entrega registrada correctamente');
    cargarMedicamentos();
    
  } catch (error) {
    console.error('Error al registrar entrega:', error);
    mostrarError(`Error: ${error.message}`);
  }
}

/**
 * Eliminar medicamento
 */
async function eliminarMedicamento(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este medicamento?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:8000/api/medicamentos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    alert('✅ Medicamento eliminado correctamente');
    cargarMedicamentos();
    
  } catch (error) {
    console.error('Error al eliminar:', error);
    mostrarError(`Error al eliminar: ${error.message}`);
  }
}

/**
 * Enviar nuevo medicamento al backend
 */
async function enviarMedicamento(datosMedicamento) {
  try {
    const token = localStorage.getItem('authToken');
    
    // Auto-generar cod_medicamento si no viene
    if (!datosMedicamento.cod_medicamento) {
      datosMedicamento.cod_medicamento = Math.floor(Math.random() * 100000);
    }
    
    // Asignar cod_usuario del usuario autenticado
    const user = await obtenerUsuarioAutenticado();
    datosMedicamento.cod_usuario = user?.id || 1;
    
    // Valores por defecto
    if (!datosMedicamento.cod_residente) datosMedicamento.cod_residente = 1;
    if (!datosMedicamento.fecha_novedad) datosMedicamento.fecha_novedad = new Date().toISOString().split('T')[0];
    if (!datosMedicamento.descrip_novedad) datosMedicamento.descrip_novedad = 'Ingreso de medicamento';
    
    const response = await fetch('http://localhost:8000/api/medicamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(datosMedicamento)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    console.log('Medicamento creado:', data);
    return data.data;
    
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    throw error;
  }
}

/**
 * Obtener datos del usuario autenticado
 */
async function obtenerUsuarioAutenticado() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('http://localhost:8000/api/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.data;
    }
    return null;
    
  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error);
    return null;
  }
}

/**
 * Mostrar error al usuario
 */
function mostrarError(mensaje) {
  alert(`❌ ${mensaje}`);
}
