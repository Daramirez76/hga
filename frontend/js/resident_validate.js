// Validación del formulario de residentes
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('formResidentes');
  
  if (form) {
    // Agregar event listener al botón Gestionar Residentes
    const btnGestionar = document.querySelector('.btn-gestionar');
    
    if (btnGestionar) {
      btnGestionar.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Obtener todos los inputs del formulario
        const inputs = form.querySelectorAll('.form-control');
        let todosValidos = true;
        
        inputs.forEach(input => {
          const valor = input.value.trim();
          
          // Validar que no esté vacío
          if (!valor) {
            input.style.borderColor = '#f44336';
            todosValidos = false;
          } else {
            input.style.borderColor = '#c8e6c9';
          }
        });
        
        // Mostrar mensaje
        if (todosValidos) {
          alert('✅ Todos los datos de residentes son válidos');
          // Aquí iría la lógica para guardar/procesar los datos
        } else {
          alert('❌ Por favor completa todos los campos de los residentes');
        }
        
        return false;
      });
    }
  }
  
  // Validación en tiempo real
  const inputs = document.querySelectorAll('.form-control');
  
  inputs.forEach(input => {
    // Al escribir, quitar el error si lo había
    input.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        this.style.borderColor = '#c8e6c9';
      }
    });
    
    // Al perder el foco, validar
    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.style.borderColor = '#f44336';
      }
    });
  });
});

