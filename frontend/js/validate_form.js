// validacionRegistro.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRegister");

  if (!form) return; // por si cambia el id

  form.addEventListener("submit", function (e) {
    // limpiamos estados anteriores
    limpiarErrores();

    const errores = [];

    const nombre       = document.getElementById("nombre");
    const apellido     = document.getElementById("apellido");
    const tipoDoc      = document.getElementById("tipo_doc");
    const nroDoc       = document.getElementById("num_doc");
    const direccion    = document.getElementById("direccion");
    const telefono     = document.getElementById("telefono");
    const correo       = document.getElementById("correo");
    const usuario      = document.getElementById("usuario");
    const contrasena   = document.getElementById("contraseña");

    // --------- Validaciones básicas ----------
    if (!valor(nombre)) {
      errores.push("El nombre es obligatorio.");
      marcarError(nombre);
    }

    if (!valor(apellido)) {
      errores.push("El apellido es obligatorio.");
      marcarError(apellido);
    }

    if (!valor(tipoDoc)) {
      errores.push("Debe seleccionar un tipo de documento.");
      marcarError(tipoDoc);
    }

    if (!valor(nroDoc)) {
      errores.push("El número de documento es obligatorio.");
      marcarError(nroDoc);
    } else if (!/^[0-9]{6,15}$/.test(nroDoc.value.trim())) {
      errores.push("El número de documento debe contener solo números (6 a 15 dígitos).");
      marcarError(nroDoc);
    }

    if (!valor(direccion)) {
      errores.push("La dirección es obligatoria.");
      marcarError(direccion);
    }

    if (!valor(telefono)) {
      errores.push("El teléfono es obligatorio.");
      marcarError(telefono);
    } else if (!/^[0-9]{7,10}$/.test(telefono.value.trim())) {
      errores.push("El teléfono debe contener solo números (7 a 10 dígitos).");
      marcarError(telefono);
    }

    if (!valor(correo)) {
      errores.push("El correo electrónico es obligatorio.");
      marcarError(correo);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim())) {
      errores.push("El correo electrónico no tiene un formato válido.");
      marcarError(correo);
    }

    if (!valor(usuario)) {
      errores.push("El nombre de usuario es obligatorio.");
      marcarError(usuario);
    } else if (usuario.value.trim().length < 4) {
      errores.push("El nombre de usuario debe tener al menos 4 caracteres.");
      marcarError(usuario);
    }

    if (!valor(contrasena)) {
      errores.push("La contraseña es obligatoria.");
      marcarError(contrasena);
    } else if (contrasena.value.length < 8) {
      errores.push("La contraseña debe tener mínimo 8 caracteres.");
      marcarError(contrasena);
    }

    // Si hay errores, se cancela el envío y se muestran
    if (errores.length > 0) {
      e.preventDefault();
      alert("Por favor corrige lo siguiente:\n\n- " + errores.join("\n- "));
    }
  });

  // --------- Helpers ---------
  function valor(input) {
    return input && input.value.trim() !== "";
  }

  function marcarError(input) {
    if (!input) return;
    input.classList.add("campo-error");
  }

  function limpiarErrores() {
    document
      .querySelectorAll(".campo-error")
      .forEach(el => el.classList.remove("campo-error"));
  }
});
















