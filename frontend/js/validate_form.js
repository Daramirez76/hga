const REGISTER_ENDPOINT = "/api/user/register/";

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
                    "X-Register-Source": "public",
                },
                body: JSON.stringify(payload),
            });

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
    return {
        tipo_doc: normalizarTipoDocumento(campos.tipoDoc.value),
        doc_id: Number(campos.numDoc.value.trim()),
        nombre: campos.nombre.value.trim(),
        apellido: campos.apellido.value.trim(),
        direccion: campos.direccion.value.trim(),
        telefono: Number(campos.telefono.value.trim()),
        edad: Number(campos.edad.value.trim()),
        email: campos.correo.value.trim(),
        usuario: campos.usuario.value.trim(),
        contraseña: campos.contrasena.value.trim(),
        parentesco: "",
    };
}

function sanitizarUsuario(data) {
    if (!data || typeof data !== "object") {
        return data;
    }

    const usuarioSanitizado = { ...data };
    delete usuarioSanitizado.cod_rol;
    delete usuarioSanitizado.rol;
    delete usuarioSanitizado.role;

    return usuarioSanitizado;
}

function normalizarTipoDocumento(valorTipoDoc) {
    const valorNormalizado = valorTipoDoc.trim().toLowerCase();

    if (valorNormalizado === "doc1" || valorNormalizado.includes("ciudadania")) {
        return "cc";
    }

    if (valorNormalizado === "doc2" || valorNormalizado.includes("extranjeria")) {
        return "ce";
    }

    return valorNormalizado;
}

function mostrarErroresBackend(data, campos) {
    const mensajes = [];
    const mapaCampos = {
        tipo_doc: campos.tipoDoc,
        doc_id: campos.numDoc,
        nombre: campos.nombre,
        apellido: campos.apellido,
        direccion: campos.direccion,
        telefono: campos.telefono,
        edad: campos.edad,
        email: campos.correo,
        usuario: campos.usuario,
        contraseña: campos.contrasena,
    };

    Object.entries(data).forEach(([clave, valor]) => {
        if (mapaCampos[clave]) {
            marcarError(mapaCampos[clave]);
        }

        if (Array.isArray(valor)) {
            mensajes.push(`${clave}: ${valor.join(", ")}`);
            return;
        }

        mensajes.push(`${clave}: ${String(valor)}`);
    });

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
