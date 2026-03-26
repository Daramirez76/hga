const API_BASE_URL = window.location.origin;
const REGISTER_ENDPOINT = `${API_BASE_URL}/api/register`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/login`;
const LOGOUT_ENDPOINT = `${API_BASE_URL}/api/logout`;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegister");
    const resendLink = document.getElementById("resendVerificationLink");
    const wizard = inicializarWizard();

    if (!form) {
        return;
    }

    const campos = obtenerCampos();
    sincronizarUsuario(campos);

    if (campos.correo) {
        campos.correo.addEventListener("input", () => sincronizarUsuario(campos));
    }

    if (resendLink) {
        resendLink.addEventListener("click", async (event) => {
            event.preventDefault();
            await window.HgaAlerts.info("Se reenviara el correo de verificacion cuando el servicio este disponible.");
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarErrores();

        sincronizarUsuario(campos);
        const errores = validarCampos(campos);

        if (errores.length > 0) {
            wizard.irA(errores[0].paso || 1);
            await window.HgaAlerts.warning(
                "Por favor corrige lo siguiente:\n\n- " + errores.map((error) => error.mensaje).join("\n- "),
                "Formulario incompleto"
            );
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
                throw new Error(`Respuesta no JSON (${response.status}). Posible redireccion inesperada. ${body.slice(0, 140)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                mostrarErroresBackend(data, campos);
                return;
            }

            localStorage.removeItem("usuario");
            await mostrarExitoRegistro(campos.correo.value.trim());
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            await window.HgaAlerts.error("Error al conectar con el servidor");
        }
    });
});

function inicializarWizard() {
    const panes = Array.from(document.querySelectorAll("[data-step-pane]"));
    const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
    const lines = Array.from(document.querySelectorAll("[data-step-line]"));
    const nextButton = document.getElementById("wizardNext");
    const prevButton = document.getElementById("wizardPrev");
    const submitButton = document.getElementById("wizardSubmit");
    const message = document.getElementById("wizardStepMessage");
    let pasoActual = 1;
    const totalPasos = panes.length || 1;

    const mensajes = {
        1: "Paso 1 de 3: ingresa tus datos de acceso y documento.",
        2: "Paso 2 de 3: completa tu nombre, apellido y edad.",
        3: "Paso 3 de 3: agrega tu direccion y telefono para crear la cuenta.",
    };

    function actualizarVista() {
        panes.forEach((pane) => {
            const paso = Number(pane.dataset.stepPane);
            pane.hidden = paso !== pasoActual;
        });

        indicators.forEach((indicator) => {
            const paso = Number(indicator.dataset.stepIndicator);
            indicator.classList.toggle("is-active", paso === pasoActual);
            indicator.classList.toggle("is-complete", paso < pasoActual);
        });

        lines.forEach((line) => {
            const paso = Number(line.dataset.stepLine);
            line.classList.toggle("is-complete", paso < pasoActual);
        });

        if (prevButton) {
            prevButton.hidden = pasoActual === 1;
        }

        if (nextButton) {
            nextButton.hidden = pasoActual === totalPasos;
        }

        if (submitButton) {
            submitButton.hidden = pasoActual !== totalPasos;
        }

        if (message) {
            message.textContent = mensajes[pasoActual];
        }
    }

    function irA(paso) {
        pasoActual = Math.max(1, Math.min(totalPasos, Number(paso) || 1));
        actualizarVista();

        const primerCampo = document.querySelector(`[data-step-pane="${pasoActual}"] input, [data-step-pane="${pasoActual}"] select`);
        if (primerCampo) {
            primerCampo.focus();
        }
    }

    if (nextButton) {
        nextButton.addEventListener("click", async () => {
            limpiarErrores();
            const campos = obtenerCampos();
            sincronizarUsuario(campos);
            const erroresDelPasoActual = validarPaso(campos, pasoActual);

            if (erroresDelPasoActual.length > 0) {
                await window.HgaAlerts.warning(
                    "Completa correctamente este paso:\n\n- " + erroresDelPasoActual.map((error) => error.mensaje).join("\n- "),
                    `Paso ${pasoActual} incompleto`
                );
                return;
            }

            irA(pasoActual + 1);
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            limpiarErrores();
            irA(pasoActual - 1);
        });
    }

    actualizarVista();

    return { irA };
}

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
        contrasena: document.getElementById("contrasena") || document.getElementById("contraseña"),
        confirmacionContrasena: document.getElementById("password_confirmation"),
        codRol: document.getElementById("cod_rol"),
        parentesco: document.getElementById("parentesco"),
    };
}

function validarCampos(campos) {
    const errores = [
        ...validarPaso(campos, 1),
        ...validarPaso(campos, 2),
        ...validarPaso(campos, 3),
    ];

    if (!valor(campos.usuario)) {
        errores.push(crearMensajeError("No fue posible generar el nombre de usuario desde el correo.", 1));
        marcarError(campos.correo);
    }

    if (valor(campos.confirmacionContrasena) && valor(campos.contrasena) && campos.confirmacionContrasena.value.trim() !== campos.contrasena.value.trim()) {
        errores.push(crearMensajeError("Las contrasenas no coinciden.", 1));
        marcarError(campos.confirmacionContrasena);
    }

    if (campos.codRol instanceof HTMLSelectElement && !valor(campos.codRol) && !campos.codRol.hidden) {
        errores.push(crearMensajeError("Debes seleccionar un rol.", 3));
        marcarError(campos.codRol);
    }

    return errores;
}

function validarPaso(campos, paso) {
    const errores = [];

    const requeridos = paso === 1
        ? [
            { input: campos.tipoDoc, mensaje: "Debe seleccionar un tipo de documento." },
            { input: campos.numDoc, mensaje: "El numero de documento es obligatorio." },
            { input: campos.correo, mensaje: "El correo electronico es obligatorio." },
            { input: campos.contrasena, mensaje: "La contraseña es obligatoria." },
            { input: campos.confirmacionContrasena, mensaje: "Confirma la contraseña." },
        ]
        : paso === 2
            ? [
            { input: campos.nombre, mensaje: "El nombre es obligatorio." },
            { input: campos.apellido, mensaje: "El apellido es obligatorio." },
            { input: campos.edad, mensaje: "La edad es obligatoria." },
        ]
            : [
            { input: campos.direccion, mensaje: "La direccion es obligatoria." },
            { input: campos.telefono, mensaje: "El telefono es obligatorio." },
        ];

    requeridos.forEach(({ input, mensaje }) => {
        if (!valor(input)) {
            errores.push(crearMensajeError(mensaje, paso));
            marcarError(input);
        }
    });

    if (paso === 1 && valor(campos.correo) && !esCorreoValido(campos.correo.value.trim())) {
        errores.push(crearMensajeError("Ingresa un correo electronico valido.", 1));
        marcarError(campos.correo);
    }

    if (paso === 1 && valor(campos.contrasena) && campos.contrasena.value.trim().length < 8) {
        errores.push(crearMensajeError("La contraseña debe tener al menos 8 caracteres.", 1));
        marcarError(campos.contrasena);
    }

    if (paso === 1 && valor(campos.confirmacionContrasena) && valor(campos.contrasena) && campos.confirmacionContrasena.value.trim() !== campos.contrasena.value.trim()) {
        errores.push(crearMensajeError("Las contrasenas no coinciden.", 1));
        marcarError(campos.confirmacionContrasena);
    }

    if (paso === 1 && valor(campos.numDoc) && !/^\d+$/.test(campos.numDoc.value.trim())) {
        errores.push(crearMensajeError("El numero de documento debe contener solo digitos.", 1));
        marcarError(campos.numDoc);
    }

    if (paso === 2 && valor(campos.edad)) {
        const edad = Number(campos.edad.value.trim());
        if (!Number.isInteger(edad) || edad < 18 || edad > 120) {
            errores.push(crearMensajeError("La edad debe ser un numero entre 18 y 120.", 2));
            marcarError(campos.edad);
        }
    }

    if (paso === 3 && valor(campos.telefono) && !/^[\d\s()+-]+$/.test(campos.telefono.value.trim())) {
        errores.push(crearMensajeError("El telefono solo puede contener numeros y caracteres de contacto validos.", 3));
        marcarError(campos.telefono);
    }

    if (campos.codRol instanceof HTMLSelectElement && !campos.codRol.hidden && !valor(campos.codRol)) {
        errores.push(crearMensajeError("Debes seleccionar un rol.", 3));
        marcarError(campos.codRol);
    }

    return errores;
}

function construirPayload(campos) {
    const docId = normalizarNumero(campos.numDoc.value);
    const telefono = normalizarNumero(campos.telefono.value);
    const payload = {
        name: campos.nombre.value.trim(),
        apellido: campos.apellido.value.trim(),
        tipo_doc: campos.tipoDoc.value.trim(),
        doc_id: Number(docId),
        direccion: campos.direccion.value.trim(),
        telefono: Number(telefono),
        email: campos.correo.value.trim(),
        usuario: campos.usuario.value.trim(),
        password: campos.contrasena.value.trim(),
        password_confirmation: campos.confirmacionContrasena?.value.trim() || campos.contrasena.value.trim(),
    };

    if (valor(campos.edad)) {
        payload.edad = Number(campos.edad.value.trim());
    }

    if (campos.codRol && valor(campos.codRol)) {
        payload.cod_rol = Number(campos.codRol.value);
    }

    if (campos.parentesco && valor(campos.parentesco)) {
        payload.parentesco = campos.parentesco.value.trim();
    }

    return payload;
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
        password_confirmation: campos.confirmacionContrasena,
        cod_rol: campos.codRol,
    };

    if (data.errors && typeof data.errors === "object") {
        Object.entries(data.errors).forEach(([clave, erroresArray]) => {
            if (mapaCampos[clave]) {
                marcarError(mapaCampos[clave]);
            }

            if (Array.isArray(erroresArray)) {
                erroresArray.forEach((error) => mensajes.push(error));
            }
        });
    }

    if (data.message && !mensajes.includes(data.message)) {
        mensajes.push(data.message);
    }

    if (mensajes.length === 0) {
        mensajes.push("No fue posible crear la cuenta");
    }

    window.HgaAlerts.error("No fue posible crear la cuenta:\n\n- " + mensajes.join("\n- "), "Registro rechazado");
}

function valor(input) {
    return Boolean(input && input.value.trim() !== "");
}

function sincronizarUsuario(campos) {
    if (!campos.usuario || !campos.correo) {
        return;
    }

    if (campos.usuario.type === "hidden") {
        campos.usuario.value = campos.correo.value.trim().toLowerCase();
    }
}

function esCorreoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function crearMensajeError(mensaje, paso) {
    return { mensaje, paso };
}

function normalizarNumero(valorCrudo) {
    return String(valorCrudo || "").replace(/\D+/g, "");
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

async function mostrarExitoRegistro(correo) {
    const overlay = document.getElementById("successOverlay");
    const successEmail = document.getElementById("successEmail");

    if (!overlay) {
        await window.HgaAlerts.success("Cuenta creada correctamente");
        window.location.href = "login.html";
        return;
    }

    if (successEmail) {
        successEmail.textContent = correo || "miusuario@ejemplo.com";
    }

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
}
