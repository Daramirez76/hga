// Validación del formulario de Cita Médica
document.addEventListener('DOMContentLoaded', function() {

  const form = document.getElementById('formCitaMedica');

  if (form) {

    // Botón Crear Cita
    const btnCrear = document.querySelector('.btn-verde-manzana');

    if (btnCrear) {
      btnCrear.addEventListener('click', function(e) {
        e.preventDefault();

        // Capturar todos los inputs
        const inputs = form.querySelectorAll('.form-control');
        let todosValidos = true;

        inputs.forEach(input => {
          const valor = input.value.trim();

          if (!valor) {
            input.style.borderColor = '#f44336'; // rojo error
            todosValidos = false;
          } else {
            input.style.borderColor = '#c8e6c9'; // verde OK
          }
        });

        // Mensajes
        if (todosValidos) {
          alert('✅ La cita médica es válida');
        } else {
          alert('❌ Por favor completa todos los campos de la cita médica');
        }

        return false;
      });
    }
  }

  // Validación en tiempo real
  const inputs = document.querySelectorAll('.form-control');

  inputs.forEach(input => {

    // Al escribir → quitar error
    input.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        this.style.borderColor = '#c8e6c9';
      }
    });

    // Al perder foco → marcar error si está vacío
    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.style.borderColor = '#f44336';
      }
    });

  });
});