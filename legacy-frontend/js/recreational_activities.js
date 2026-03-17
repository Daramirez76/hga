// Gestión de Actividades Lúdicas con AJAX
document.addEventListener('DOMContentLoaded', function() {
  const btnNuevaActividad = document.querySelector('.btn-verde-manzana');
  const filtroTipo = document.querySelectorAll('.col-lg-3 .btn-light');
  const filtroFecha = document.querySelector('.col-lg-3 input[type="date"]');
  
  // Cargar actividades al iniciar
  cargarActividades();
  
  // Event listener para nueva actividad
  if (btnNuevaActividad) {
    btnNuevaActividad.addEventListener('click', () => {
      abrirModalNuevaActividad();
    });
  }
  
  // Event listeners para filtros
  filtroTipo.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tipo = e.target.textContent.trim();
      filtrarActividadesPorTipo(tipo);
    });
  });
  
  if (filtroFecha) {
    filtroFecha.addEventListener('change', (e) => {
      filtrarActividadesPorFecha(e.target.value);
    });
  }
});

/**
 * Cargar todas las actividades desde el backend
 */
async function cargarActividades() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('http://localhost:8000/api/actividades', {
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
    
    console.log('Actividades cargadas:', data.data);
    renderizarActividades(data.data);
    
  } catch (error) {
    console.error('Error al cargar actividades:', error);
    mostrarError(`No se pudieron cargar las actividades: ${error.message}`);
  }
}

/**
 * Renderizar las tarjetas de actividades en el DOM
 */
function renderizarActividades(actividades) {
  const contenedor = document.querySelector('.d-flex.overflow-auto.gap-3');
  
  if (!contenedor) {
    console.warn('Contenedor de actividades no encontrado');
    return;
  }
  
  // Limpiar contenedor excepto el primer elemento (si es un label)
  contenedor.innerHTML = '';
  
  if (!actividades || actividades.length === 0) {
    contenedor.innerHTML = '<p class="text-muted">No hay actividades disponibles</p>';
    return;
  }
  
  actividades.forEach(actividad => {
    const tarjeta = crearTarjetaActividad(actividad);
    contenedor.appendChild(tarjeta);
  });
}

/**
 * Crear elemento HTML para tarjeta de actividad
 */
function crearTarjetaActividad(actividad) {
  const card = document.createElement('div');
  card.classList.add('card', 'shadow-sm', 'border-0', 'rounded-4', 'p-3');
  card.style.minWidth = '300px';
  
  const estado = determinarEstado(actividad.Fecha, actividad.Hora_ini, actividad.Hora_fin);
  const badgeClass = getBadgeClass(estado);
  
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-2">
      <h5 class="fw-bold text-primary">${actividad.Nombre}</h5>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarActividad(${actividad.id})">×</button>
    </div>
    <p class="text-muted">${formatearFecha(actividad.Fecha)}, ${actividad.Hora_ini}</p>
    <span class="badge ${badgeClass}">${estado}</span>
    <p class="mt-2"><i class="bi bi-geo-alt"></i> ${actividad.Lugar}</p>
    <p class="text-muted"><small>Horario: ${actividad.Hora_ini} - ${actividad.Hora_fin}</small></p>
    <button class="btn btn-sm btn-info mt-2" onclick="editarActividad(${actividad.id})">Editar</button>
  `;
  
  return card;
}

/**
 * Determinar el estado de una actividad (Finalizada, En curso, Abierta)
 */
function determinarEstado(fecha, horaIni, horaFin) {
  const ahora = new Date();
  const fechaActividad = new Date(fecha);
  const [hIni, mIni] = horaIni.split(':');
  const [hFin, mFin] = horaFin.split(':');
  
  const inicio = new Date(fechaActividad);
  inicio.setHours(parseInt(hIni), parseInt(mIni), 0);
  
  const fin = new Date(fechaActividad);
  fin.setHours(parseInt(hFin), parseInt(mFin), 0);
  
  if (ahora > fin) {
    return 'Finalizada';
  } else if (ahora >= inicio && ahora <= fin) {
    return 'En curso';
  } else {
    return 'Abierta';
  }
}

/**
 * Obtener clase CSS para el badge según el estado
 */
function getBadgeClass(estado) {
  switch (estado) {
    case 'Finalizada':
      return 'bg-secondary';
    case 'En curso':
      return 'bg-info text-dark';
    case 'Abierta':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
}

/**
 * Formatear fecha a formato legible
 */
function formatearFecha(fecha) {
  const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

/**
 * Filtrar actividades por tipo (categoría)
 */
async function filtrarActividadesPorTipo(tipo) {
  try {
    const token = localStorage.getItem('authToken');
    
    // Aquí se podría agregar un parámetro de query si el backend lo soporta
    const response = await fetch(`http://localhost:8000/api/actividades?tipo=${encodeURIComponent(tipo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.warn('Filtro por tipo no soportado en el backend');
      // Filtrar en el frontend como fallback
      await cargarActividades();
      return;
    }
    
    renderizarActividades(data.data);
    
  } catch (error) {
    console.error('Error al filtrar por tipo:', error);
  }
}

/**
 * Filtrar actividades por fecha
 */
async function filtrarActividadesPorFecha(fecha) {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:8000/api/actividades?fecha=${fecha}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.warn('Filtro por fecha no soportado en el backend');
      await cargarActividades();
      return;
    }
    
    renderizarActividades(data.data);
    
  } catch (error) {
    console.error('Error al filtrar por fecha:', error);
  }
}

/**
 * Abrir modal para crear nueva actividad
 */
function abrirModalNuevaActividad() {
  const form = prompt('Implementar modal de nueva actividad\n\nCampos requeridos:\n- Nombre\n- Fecha (YYYY-MM-DD)\n- Hora inicio (HH:mm)\n- Hora fin (HH:mm)\n- Ubicación\n- Residente ID\n- Rol ID');
  
  if (!form) return;
  
  // Mostrar un alert explicativo por ahora
  alert('Se implementará un modal completo para crear actividades');
}

/**
 * Eliminar una actividad
 */
async function eliminarActividad(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:8000/api/actividades/${id}`, {
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
    
    alert('✅ Actividad eliminada correctamente');
    cargarActividades(); // Recargar lista
    
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    mostrarError(`No se pudo eliminar: ${error.message}`);
  }
}

/**
 * Editar una actividad
 */
async function editarActividad(id) {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:8000/api/actividades/${id}`, {
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
    
    const actividad = data.data;
    
    // Mostrar formulario de edición (placeholder)
    alert(`Editar actividad: ${actividad.Nombre}\n\nSe implementará un modal de edición`);
    
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    mostrarError(`No se pudo cargar la actividad: ${error.message}`);
  }
}

/**
 * Enviar nueva actividad al backend
 */
async function enviarActividad(datosActividad) {
  try {
    const token = localStorage.getItem('authToken');
    
    // Auto-generar Cod_acti_ludi si no viene
    if (!datosActividad.Cod_acti_ludi) {
      datosActividad.Cod_acti_ludi = Math.floor(Math.random() * 100000);
    }
    
    // Asignar doc_id del usuario autenticado
    const user = await obtenerUsuarioAutenticado();
    datosActividad.doc_id = user?.id || 1;
    
    const response = await fetch('http://localhost:8000/api/actividades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(datosActividad)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    console.log('Actividad creada:', data);
    return data.data;
    
  } catch (error) {
    console.error('Error al crear actividad:', error);
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
