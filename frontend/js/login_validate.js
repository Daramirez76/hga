const LOGIN_ENDPOINT = `${globalThis.location.origin}/api/login`;
const LOGIN_SUCCESS_REDIRECT = "home.html";
const JSON_CONTENT_TYPE = "application/json";

function obtenerCampo(id) {
    const campo = document.getElementById(id);

    if (!(campo instanceof HTMLInputElement)) {
        throw new TypeError(`No se encontro un campo valido con id "${id}"`);
    }

    return campo;
}

function obtenerCredenciales() {
    const usuarioInput = obtenerCampo("usuario");
    const contrasenaInput = obtenerCampo("contrasena");

    return {
        usuarioInput,
        contrasenaInput,
        email: usuarioInput.value.trim(),
        password: contrasenaInput.value.trim(),
    };
}

async function validarFormulario() {
    const {
        usuarioInput,
        contrasenaInput,
        email,
        password,
    } = obtenerCredenciales();

    limpiarErrores();

    if (email === "") {
        marcarError(usuarioInput);
        await window.HgaAlerts.warning("El correo o usuario no puede estar vacio", "Campo requerido");
        return false;
    }

    if (password === "") {
        marcarError(contrasenaInput);
        await window.HgaAlerts.warning("La contrasena no puede estar vacia", "Campo requerido");
        return false;
    }

    return true;
}

async function iniciarSesion(event) {
    event.preventDefault();

    try {
        if (!(await validarFormulario())) {
            return;
        }

        const { email, password } = obtenerCredenciales();
        const datos = {
            email,
            password,
        };

        const response = await fetch(LOGIN_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": JSON_CONTENT_TYPE,
                "Accept": JSON_CONTENT_TYPE,
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify(datos),
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes(JSON_CONTENT_TYPE)) {
            const body = await response.text();
            throw new Error(`Respuesta no JSON (${response.status}). Posible redireccion inesperada. ${body.slice(0, 140)}`);
        }

        const data = await response.json();

        if (!response.ok) {
            const mensaje = data.message || "No fue posible iniciar sesion";
            await window.HgaAlerts.error(mensaje, "No fue posible iniciar sesion");
            return;
        }

        if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
        }

        localStorage.setItem("usuario", JSON.stringify(data.user));
        await window.HgaAlerts.success("Login exitoso");
        const loginRedirectUrl = new URL(LOGIN_SUCCESS_REDIRECT, globalThis.location.href);
        globalThis.location.replace(loginRedirectUrl.toString());
    } catch (error) {
        console.error("Error al iniciar sesion:", error);
        await window.HgaAlerts.error("Error al conectar con el servidor");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("loginForm");
    if (formulario) {
        formulario.addEventListener("submit", iniciarSesion);
    }
});

function marcarError(input) {
    if (!input) {
        return;
    }

    input.classList.add("field-error");
}

function limpiarErrores() {
    document
        .querySelectorAll(".field-error")
        .forEach((elemento) => elemento.classList.remove("field-error"));
}
