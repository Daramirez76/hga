// Validación del formulario de actividad lúdica
document.addEventListener('DOMContentLoaded', function() {

  const form = document.getElementById('formActividad');

  if (form) {

    // // Agregar event listener al botón Crear Actividad
    const btnCrear = document.querySelector('.btn-verde-manzana');

    if (btnCrear) {
      btnCrear.addEventListener('click', function(e) {
        e.preventDefault();

        // Obtener todos los inputs del formulario
        const inputs = form.querySelectorAll('.form-control, .form-select');
        let todosValidos = true;

        inputs.forEach(input => {
          const valor = input.value.trim();

          // Validar que el campo no este vacío
          if (!valor) {
            input.style.borderColor = '#f44336'; 
            todosValidos = false;
          } else {
            input.style.borderColor = '#c8e6c9';
          }
        });

        // Mostrar Mensajes
        if (todosValidos) {
          alert('✅ Los datos de la actividad son válidos');
          // Aquí iría la lógica para guardar/procesar los datos
        } else {
          alert('❌ Por favor completa todos los campos de la actividad');
        }

        return false;
      });
    }
  }

  // Validación en tiempo real
  const inputs = document.querySelectorAll('.form-control, .form-select');

  inputs.forEach(input => {
    // Al escribir → quitar error si lo habia
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