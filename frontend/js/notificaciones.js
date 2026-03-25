// Gestión de Notificaciones con AJAX
document.addEventListener('DOMContentLoaded', function() {
  // Cargar todas las notificaciones al iniciar
  cargarNotificaciones();
  
  // Refrescar notificaciones cada 10 segundos
  setInterval(cargarNotificaciones, 10000);
});

/**
 * Cargar y generar todas las notificaciones
 */
async function cargarNotificaciones() {
  try {
    // Obtener datos de residentes
    const residentes = await cargarDatos('residentes');
    
    // Obtener datos de actividades
    const actividades = await cargarDatos('actividades');
    
    // Obtener datos de citas
    const citas = await cargarDatos('citas');
    
    // Generar notificaciones basadas en los datos
    const notificaciones = generarNotificaciones(residentes, actividades, citas);
    
    // Renderizar en el DOM
    renderizarNotificaciones(notificaciones);
    
    // También guardar notificaciones en el backend (informes)
    guardarNotificacionesEnBackend(notificaciones);
    
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

/**
 * Cargar datos de un endpoint del backend
 */
async function cargarDatos(recurso) {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:8000/api/${recurso}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.warn(`No se pudieron cargar ${recurso}`);
      return [];
    }
    
    return data.data || [];
    
  } catch (error) {
    console.error(`Error al cargar datos de ${recurso}:`, error);
    return [];
  }
}

/**
 * Generar notificaciones a partir de residentes, actividades y citas
 */
function generarNotificaciones(residentes = [], actividades = [], citas = []) {
  const notificaciones = [];
  
  // Notificaciones de citas próximas
  if (citas && citas.length > 0) {
    citas.forEach(cita => {
      // Buscar el residente asociado
      const residente = residentes.find(r => r.id === cita.cod_residente);
      const nombreResidente = residente ? residente.nombre : 'Residente desconocido';
      
      notificaciones.push({
        id: `cita-${cita.id}`,
        tipo: 'cita',
        titulo: `${nombreResidente}: Tiene cita ${cita.tipo_cita || 'Médica'}`,
        descripcion: `${cita.motivo || 'Cita médica'} - ${formatearFecha(cita.fecha)} a las ${cita.hora || 'hora no especificada'}`,
        fecha: cita.fecha,
        urgencia: esCitaProxima(cita.fecha) ? 'alta' : 'normal',
        icono: '📅'
      });
    });
  }
  
  // Notificaciones de actividades próximas
  if (actividades && actividades.length > 0) {
    actividades.forEach(actividad => {
      // Buscar el residente asociado
      const residente = residentes.find(r => r.id === actividad.cod_residente);
      const nombreResidente = residente ? residente.nombre : 'Residente desconocido';
      
      notificaciones.push({
        id: `actividad-${actividad.id}`,
        tipo: 'actividad',
        titulo: `${nombreResidente}: ${actividad.Nombre || 'Actividad'}`,
        descripcion: `${actividad.Lugar || 'Lugar no especificado'} - ${formatearFecha(actividad.Fecha)} a las ${actividad.Hora_ini || 'hora no especificada'}`,
        fecha: actividad.Fecha,
        urgencia: esActividadProxima(actividad.Fecha, actividad.Hora_ini) ? 'alta' : 'normal',
        icono: '🎯'
      });
    });
  }
  
  // Notificaciones de información de residentes
  if (residentes && residentes.length > 0) {
    residentes.forEach(residente => {
      // Un residente registrado
      notificaciones.push({
        id: `residente-${residente.id}`,
        tipo: 'residente',
        titulo: `Residente registrado: ${residente.nombre}`,
        descripcion: `${residente.apellido} - ${residente.edad} años - Patología: ${residente.patologia}`,
        fecha: residente.created_at || new Date().toISOString(),
        urgencia: 'baja',
        icono: '👤'
      });
    });
  }
  
  // Ordenar por urgencia y fecha (más urgentes primero)
  notificaciones.sort((a, b) => {
    const urgenciaOrder = { alta: 0, normal: 1, baja: 2 };
    if (urgenciaOrder[a.urgencia] !== urgenciaOrder[b.urgencia]) {
      return urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
    }
    return new Date(b.fecha) - new Date(a.fecha);
  });
  
  return notificaciones;
}

/**
 * Verificar si una cita es próxima (dentro de 7 días)
 */
function esCitaProxima(fecha) {
  const hoy = new Date();
  const citaDate = new Date(fecha);
  const diferencia = citaDate - hoy;
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return dias >= 0 && dias <= 7;
}

/**
 * Verificar si una actividad es próxima (hoy o mañana)
 */
function esActividadProxima(fecha, hora) {
  const hoy = new Date();
  const actividadDate = new Date(fecha);
  const diferencia = actividadDate - new Date(hoy.toISOString().split('T')[0]);
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return dias >= 0 && dias <= 1;
}

/**
 * Formatear fecha a formato legible
 */
function formatearFecha(fecha) {
  const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

/**
 * Renderizar notificaciones en el DOM
 */
function renderizarNotificaciones(notificaciones) {
  // Obtener los slots del DOM
  const elementos = document.querySelectorAll('.col-md-3');
  
  if (elementos.length < 4) {
    console.warn('No se encontraron los 4 slots esperados');
    return;
  }
  
  // Filtrar notificaciones por tipo
  const notifResidentes = notificaciones.filter(n => n.tipo === 'residente');
  const notifActividades = notificaciones.filter(n => n.tipo === 'actividad');
  const notifCitas = notificaciones.filter(n => n.tipo === 'cita');
  const notifOtras = notificaciones.slice(0, 3); // Las 3 primeras (más urgentes)
  
  // Renderizar en cada slot
  renderizarSlot(elementos[0], 'Residentes', notifResidentes);
  renderizarSlot(elementos[1], 'Actividades Lúdicas', notifActividades);
  renderizarSlot(elementos[2], 'Citas', notifCitas);
  renderizarSlotNotificaciones(elementos[3], notifOtras);
}

/**
 * Renderizar un slot genérico
 */
function renderizarSlot(elemento, titulo, notificaciones) {
  let html = `<div class="card custom-card"><h5>${titulo}</h5>`;
  
  if (notificaciones.length === 0) {
    html += '<p class="text-muted">No hay registros</p>';
  } else {
    html += '<ul>';
    notificaciones.slice(0, 4).forEach(notif => {
      const nombre = extractarNombre(notif.titulo);
      html += `<li>${nombre}</li>`;
    });
    html += '</ul>';
  }
  
  html += '</div>';
  elemento.innerHTML = html;
}

/**
 * Renderizar slot de notificaciones
 */
function renderizarSlotNotificaciones(elemento, notificaciones) {
  let html = '<div class="card noti-card"><h5>Notificaciones</h5>';
  
  if (notificaciones.length === 0) {
    html += '<div class="noti-card"><p class="text-muted">✓ Sin notificaciones nuevas</p></div>';
  } else {
    notificaciones.forEach(notif => {
      const color = notif.urgencia === 'alta' ? 'warning' : 'info';
      html += `
        <div class="noti-card">
          <p><strong>${notif.icono} ${extractarNombre(notif.titulo)}:</strong> ${notif.descripcion}</p>
        </div>
      `;
    });
  }
  
  html += '</div>';
  elemento.innerHTML = html;
}

/**
 * Extraer nombre del título de la notificación
 */
function extractarNombre(titulo) {
  // Si el título contiene ":", tomar solo la parte después
  if (titulo.includes(':')) {
    return titulo.split(':')[0].trim();
  }
  return titulo;
}

/**
 * Guardar notificaciones en el backend (tabla informes)
 */
async function guardarNotificacionesEnBackend(notificaciones) {
  try {
    const token = localStorage.getItem('authToken');
    
    // Solo guardar notificaciones de alta urgencia
    const notificacionesAlta = notificaciones.filter(n => n.urgencia === 'alta');
    
    for (const notif of notificacionesAlta) {
      // Verificar si la notificación ya existe
      const yaExiste = await verificarNotificacionExistente(notif.id);
      
      if (!yaExiste) {
        await fetch('http://localhost:8000/api/informes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            cod_Informes: Math.floor(Math.random() * 100000),
            Titulo_Informes: notif.titulo,
            descripcion: notif.descripcion,
            tipo: notif.tipo,
            urgencia: notif.urgencia
          })
        });
      }
    }
    
  } catch (error) {
    console.warn('No se pudieron guardar notificaciones en el backend:', error);
  }
}

/**
 * Verificar si una notificación ya existe en el backend
 */
async function verificarNotificacionExistente(notifId) {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('http://localhost:8000/api/informes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.data) {
      // Aquí verificaríamos si la notificación ya existe
      // Por ahora retornamos false para permitir duplicados
      return false;
    }
    
    return false;
    
  } catch (error) {
    return false;
  }
}

/**
 * Marcar notificación como leída
 */
async function marcarComoLeida(notifId) {
  console.log(`Notificación ${notifId} marcada como leída`);
}
