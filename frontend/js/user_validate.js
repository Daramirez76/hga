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
        alert('❌ Por favor completa todos los campos');
        return false;
      }
      
      
      if (nombre.length < 3) {
        alert('❌ El nombre debe tener al menos 3 caracteres');
        return false;
      }
      
      
      if (!/^\d{10,}$/.test(telefono)) {
        alert('❌ El teléfono debe contener al menos 10 dígitos numéricos');
        return false;
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('❌ Por favor ingresa un email válido');
        return false;
      }
      
      // Si todas las validaciones pasan
      alert('✅ Datos actualizados correctamente');
      // Aquí iría el envío del formulario al servidor
      
      
      return false;
    });
  }
});
