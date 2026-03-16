// Gestión de Visitas - visitas.js

let formulario = null;
let boton = null;
let listaVisitas = null;

// Inputs del formulario
let inputCodVisitas = null;
let inputDocId = null;
let inputNombVisitante = null;
let inputCodResidente = null;
let inputFechaVisita = null;
let inputHora = null;
let inputCodUsuario = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener formulario
    formulario = document.getElementById('formNuevaVisita');
    boton = formulario.querySelector('button[type="submit"]');
    
    // Obtener container de visitas
    listaVisitas = document.getElementById('listaVisitasContainer');
    
    // Obtener inputs
    inputCodVisitas = document.getElementById('codVisitas');
    inputDocId = document.getElementById('docId');
    inputNombVisitante = document.getElementById('nombVisitante');
    inputCodResidente = document.getElementById('codResidente');
    inputFechaVisita = document.getElementById('fechaVisita');
    inputHora = document.getElementById('hora');
    inputCodUsuario = document.getElementById('codUsuario');
    
    // Evento del botón
    if (boton) {
        boton.addEventListener('click', crearVisita);
    }
    
    // Cargar visitas al inicio
    cargarVisitas();
});

// Cargar visitas del servidor
function cargarVisitas() {
    fetch('/api/visitas', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(respuesta => respuesta.json())
    .then(datos => {
        if (datos.data && datos.data.length > 0) {
            listaVisitas.innerHTML = '';
            
            datos.data.forEach(visita => {
                let div = document.createElement('div');
                div.className = 'mensaje';
                
                let fecha = new Date(visita.Fecha_Visita);
                let fechaFormato = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                div.innerHTML = '<strong>' + visita.Nomb_visitante + '</strong> visita a <strong>' + 
                                visita.cod_Residente + '</strong> el <strong>' + fechaFormato + '</strong>';
                
                listaVisitas.appendChild(div);
            });
        } else {
            listaVisitas.innerHTML = '<p>No hay visitas registradas.</p>';
        }
    })
    .catch(error => {
        console.log('Error al cargar visitas:', error);
        listaVisitas.innerHTML = '<p>Error al cargar visitas.</p>';
    });
}

// Crear nueva visita
function crearVisita(evento) {
    evento.preventDefault();
    
    // Validar campos
    if (!inputCodVisitas.value || !inputDocId.value || !inputNombVisitante.value ||
        !inputCodResidente.value || !inputFechaVisita.value || !inputCodUsuario.value) {
        
        alert('❌ Por favor completa todos los campos');
        return;
    }
    
    // Validar que la fecha no sea en el pasado
    let fechaIngresada = new Date(inputFechaVisita.value);
    let hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaIngresada < hoy) {
        alert('❌ La fecha no puede ser en el pasado');
        return;
    }
    
    // Deshabilitar botón
    boton.disabled = true;
    boton.textContent = 'Registrando...';
    
    // Preparar datos
    let datos = {
        cod_Visitas: parseInt(inputCodVisitas.value),
        doc_id: parseInt(inputDocId.value),
        Nomb_visitante: inputNombVisitante.value,
        cod_Residente: parseInt(inputCodResidente.value),
        Fecha_Visita: inputFechaVisita.value,
        cod_usuario: parseInt(inputCodUsuario.value)
    };
    
    // Enviar al servidor
    fetch('/api/visitas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(respuesta => respuesta.json())
    .then(datos => {
        alert('✅ Visita registrada exitosamente');
        formulario.reset();
        
        // Recargar lista después de 2 segundos
        setTimeout(() => {
            cargarVisitas();
            boton.disabled = false;
            boton.textContent = 'Confirmar';
        }, 2000);
    })
    .catch(error => {
        alert('❌ Error al registrar la visita');
        console.log(error);
        boton.disabled = false;
        boton.textContent = 'Confirmar';
    });
}
