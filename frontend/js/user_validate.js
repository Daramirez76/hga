// Validación del formulario de actualizar datos
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('#edit form');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      
      const nombre = document.querySelector('input[name="nombre"]').value.trim();
      const telefono = document.querySelector('input[name="telefono"]').value.trim();
      const email = document.querySelector('input[name="email"]').value.trim();
      
      
      if (!nombre || !telefono || !email) {
        window.HgaAlerts.warning('Por favor completa todos los campos', 'Formulario incompleto');
        return false;
      }
      
      
      if (nombre.length < 3) {
        window.HgaAlerts.warning('El nombre debe tener al menos 3 caracteres', 'Nombre invalido');
        return false;
      }
      
      
      if (!/^\d{10,}$/.test(telefono)) {
        window.HgaAlerts.warning('El telefono debe contener al menos 10 digitos numericos', 'Telefono invalido');
        return false;
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        window.HgaAlerts.warning('Por favor ingresa un email valido', 'Correo invalido');
        return false;
      }
      
      // Si todas las validaciones pasan
      window.HgaAlerts.success('Datos actualizados correctamente');
      // Aquí iría el envío del formulario al servidor
      
      
      return false;
    });
  }
});
