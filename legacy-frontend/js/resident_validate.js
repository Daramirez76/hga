// Validación y gestión del formulario de residentes con AJAX
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('formResidentes');
  
  if (form) {
    // Agregar event listener al botón Gestionar Residentes
    const btnGestionar = document.querySelector('.btn-gestionar');
    
    if (btnGestionar) {
      btnGestionar.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Obtener todos los inputs del formulario
        const inputs = form.querySelectorAll('.form-control');
        let todosValidos = true;
        
        // Validar que no estén vacíos
        inputs.forEach(input => {
          const valor = input.value.trim();
          
          if (!valor) {
            input.style.borderColor = '#f44336';
            todosValidos = false;
          } else {
            input.style.borderColor = '#c8e6c9';
          }
        });
        
        if (!todosValidos) {
          alert('❌ Por favor completa todos los campos de los residentes');
          return false;
        }
        
        // Recopilar datos de residentes
        const residentes = [];
        const grupos = form.querySelectorAll('[style*="color: #2e7d32"]');
        
        // Procesar cada residente
        grupoActual = 0;
        inputs.forEach((input, index) => {
          const residenteIndex = Math.floor(index / 5);
          
          if (!residentes[residenteIndex]) {
            residentes[residenteIndex] = {};
          }
          
          // Mapear campos según el atributo name
          if (input.name.includes('nombre')) {
            residentes[residenteIndex].nombre = input.value.trim();
          } else if (input.name.includes('apellido')) {
            residentes[residenteIndex].apellido = input.value.trim();
          } else if (input.name.includes('patologia')) {
            residentes[residenteIndex].patologia = input.value.trim();
          } else if (input.name.includes('edad')) {
            residentes[residenteIndex].edad = parseInt(input.value.trim());
          } else if (input.name.includes('rh')) {
            residentes[residenteIndex].RH = input.value.trim().toUpperCase();
          }
        });
        
        // Enviar cada residente al backend
        try {
          btnGestionar.disabled = true;
          btnGestionar.textContent = 'Guardando...';
          
          for (const residente of residentes) {
            await enviarResidente(residente);
          }
          
          alert('✅ Residentes guardados correctamente');
          form.reset();
          inputs.forEach(input => {
            input.style.borderColor = '#c8e6c9';
          });
        } catch (error) {
          console.error('Error al guardar residentes:', error);
          alert(`❌ Error al guardar: ${error.message}`);
        } finally {
          btnGestionar.disabled = false;
          btnGestionar.textContent = 'Gestionar Residentes';
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

/**
 * Envía un residente al backend mediante AJAX
 * @param {Object} residente - Objeto con los datos del residente
 * @returns {Promise} Promesa que se resuelve cuando se completa la petición
 */
async function enviarResidente(residente) {
  try {
    // Obtener el token JWT del localStorage (si está autenticado)
    const token = localStorage.getItem('access_token');
    
    // Configurar headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Agregar token si existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Realizar petición POST al endpoint /residentes
    const response = await fetch('https://super-duper-rotary-phone-5gq4v49wvqp6c77v9-8000.app.github.dev/api/residentes', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(residente),
    });
    
    // Parsear respuesta JSON
    const data = await response.json();
    
    // Verificar código de estado HTTP
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    console.log('Residente guardado:', data);
    return data;
    
  } catch (error) {
    console.error('Error en enviarResidente:', error);
    throw error;
  }
}

