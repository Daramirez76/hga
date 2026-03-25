// Formulario de Citas - date.js

let form = null;
let botonEnviar = null;

// Elementos del formulario
let inputFecha = null;
let inputHoraInicio = null;
let inputHoraFin = null;
let inputAcompanante = null;
let inputCodigoResidente = null;
let inputLugar = null;
let inputCodigoCita = null;

// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias del formulario
    form = document.querySelector('form');
    botonEnviar = document.querySelector('.btn-verde-manzana');
    
    // Obtener inputs
    inputFecha = document.getElementById('date');
    inputHoraInicio = document.getElementById('HoraIncinput');
    inputHoraFin = document.getElementById('HoraFininput');
    inputAcompanante = document.getElementById('NomAcominput');
    inputCodigoResidente = document.getElementById('Codinput');
    inputLugar = document.getElementById('Lugarinput');
    inputCodigoCita = document.getElementById('Codctinput');
    
    // Agregar evento al botón
    if (botonEnviar) {
        botonEnviar.addEventListener('click', guardarCita);
    }
});

// Función para guardar la cita
function guardarCita(evento) {
    evento.preventDefault();
    
    // Validar que los campos no estén vacíos
    if (!inputFecha.value || !inputHoraInicio.value || !inputHoraFin.value || 
        !inputAcompanante.value || !inputCodigoResidente.value || 
        !inputLugar.value || !inputCodigoCita.value) {
        
        mostrarError('Por favor completa todos los campos');
        return;
    }
    
    // Validar que hora fin sea mayor que hora inicio
    if (inputHoraFin.value <= inputHoraInicio.value) {
        mostrarError('La hora de fin debe ser posterior a la hora de inicio');
        return;
    }
    
    // Deshabilitar botón
    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Enviando...';
    
    // Preparar datos para enviar
    let datos = {
        cod_cita: parseInt(inputCodigoCita.value),
        Fecha_cita: inputFecha.value,
        hora_inicio: inputHoraInicio.value,
        hora_fin: inputHoraFin.value,
        Nombre_acompañante: inputAcompanante.value,
        Lugar_cita: inputLugar.value,
        cod_Residente: parseInt(inputCodigoResidente.value)
    };
    
    // Enviar petición al servidor
    fetch('/api/citas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(respuesta => respuesta.json())
    .then(datos => {
        if (datos) {
            mostrarExito('Cita creada exitosamente');
            form.reset();
            setTimeout(() => {
                botonEnviar.disabled = false;
                botonEnviar.textContent = 'Crear Cita';
            }, 2000);
        }
    })
    .catch(error => {
        mostrarError('Error al crear la cita');
        console.log(error);
        botonEnviar.disabled = false;
        botonEnviar.textContent = 'Crear Cita';
    });
}

// Función para mostrar errores
function mostrarError(mensaje) {
    alert('❌ ' + mensaje);
}

// Función para mostrar éxito
function mostrarExito(mensaje) {
    alert('✅ ' + mensaje);
}
