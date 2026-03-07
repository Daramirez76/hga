const API_BASE_URL = window.location.origin;
const REGISTER_ENDPOINT = `${API_BASE_URL}/api/register`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/login`;
const LOGOUT_ENDPOINT = `${API_BASE_URL}/api/logout`;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegister");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarErrores();

        const campos = obtenerCampos();
        const errores = validarCampos(campos);

        if (errores.length > 0) {
            alert("Por favor corrige lo siguiente:\n\n- " + errores.join("\n- "));
            return;
        }

        const payload = construirPayload(campos);

        try {
            const response = await fetch(REGISTER_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-Register-Source": "public",
                },
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const body = await response.text();
                throw new Error(`Respuesta no JSON (${response.status}). Posible redirección inesperada. ${body.slice(0, 140)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                mostrarErroresBackend(data, campos);
                return;
            }

            localStorage.setItem("usuario", JSON.stringify(sanitizarUsuario(data)));
            alert("Cuenta creada correctamente");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            alert("Error al conectar con el servidor");
        }
    });
});

function obtenerCampos() {
    return {
        nombre: document.getElementById("nombre"),
        apellido: document.getElementById("apellido"),
        tipoDoc: document.getElementById("tipo_doc"),
        numDoc: document.getElementById("num_doc"),
        direccion: document.getElementById("direccion"),
        telefono: document.getElementById("telefono"),
        edad: document.getElementById("edad"),
        correo: document.getElementById("correo"),
        usuario: document.getElementById("usuario"),
        contrasena: document.getElementById("contraseña"),
    };
}

function validarCampos(campos) {
    const errores = [];

    const requeridos = [
        { input: campos.nombre, mensaje: "El nombre es obligatorio." },
        { input: campos.apellido, mensaje: "El apellido es obligatorio." },
        { input: campos.tipoDoc, mensaje: "Debe seleccionar un tipo de documento." },
        { input: campos.numDoc, mensaje: "El numero de documento es obligatorio." },
        { input: campos.direccion, mensaje: "La direccion es obligatoria." },
        { input: campos.telefono, mensaje: "El telefono es obligatorio." },
        { input: campos.edad, mensaje: "La edad es obligatoria." },
        { input: campos.correo, mensaje: "El correo electronico es obligatorio." },
        { input: campos.usuario, mensaje: "El nombre de usuario es obligatorio." },
        { input: campos.contrasena, mensaje: "La contraseña es obligatoria." },
    ];

    requeridos.forEach(({ input, mensaje }) => {
        if (!valor(input)) {
            errores.push(mensaje);
            marcarError(input);
        }
    });

    return errores;
}

function construirPayload(campos) {
    // Combinar nombre y apellido para el campo "name" del backend
    const nombreCompleto = `${campos.nombre.value.trim()} ${campos.apellido.value.trim()}`.trim();
    
    return {
        name: nombreCompleto,
        apellido: campos.apellido.value.trim(),
        tipo_doc: campos.tipoDoc.value.trim(),
        doc_id: Number(campos.numDoc.value.trim()),
        direccion: campos.direccion.value.trim(),
        telefono: Number(campos.telefono.value.trim()),
        edad: Number(campos.edad.value.trim()),
        email: campos.correo.value.trim(),
        usuario: campos.usuario.value.trim(),
        password: campos.contrasena.value.trim(),
        password_confirmation: campos.contrasena.value.trim(),
    };
}

function sanitizarUsuario(data) {
    // El backend retorna { success, message, user: { id, name, email } }
    // Extractamos solo el objeto user
    if (data && data.user) {
        return data.user;
    }
    return data;
}


function mostrarErroresBackend(data, campos) {
    const mensajes = [];
    const mapaCampos = {
        name: campos.nombre,
        apellido: campos.apellido,
        tipo_doc: campos.tipoDoc,
        doc_id: campos.numDoc,
        direccion: campos.direccion,
        telefono: campos.telefono,
        edad: campos.edad,
        email: campos.correo,
        usuario: campos.usuario,
        password: campos.contrasena,
    };

    // Manejo de errores de validación del backend
    if (data.errors && typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(([clave, erroresArray]) => {
            // Marcar el campo con error
            if (mapaCampos[clave]) {
                marcarError(mapaCampos[clave]);
            }
            
            // Agregar mensajes de error
            if (Array.isArray(erroresArray)) {
                erroresArray.forEach(error => mensajes.push(error));
            }
        });
    }
    
    // Manejo de mensaje genérico del backend
    if (data.message) {
        if (!mensajes.includes(data.message)) {
            mensajes.push(data.message);
        }
    }
    
    // Si no hay mensajes específicos, mostrar respuesta genérica
    if (mensajes.length === 0) {
        mensajes.push("No fue posible crear la cuenta");
    }

    alert("No fue posible crear la cuenta:\n\n- " + mensajes.join("\n- "));
}

function valor(input) {
    return input && input.value.trim() !== "";
}

function marcarError(input) {
    if (!input) {
        return;
    }

    input.classList.add("campo-error");
}

function limpiarErrores() {
    document
        .querySelectorAll(".campo-error")
        .forEach((elemento) => elemento.classList.remove("campo-error"));
}
