const LOGIN_ENDPOINT = `${globalThis.location.origin}/api/login`;
const DEFAULT_LOGIN_REDIRECT = "home.html";
const JSON_CONTENT_TYPE = "application/json";

function obtenerRolUsuario(user = {}) {
    return Number(user?.cod_rol || user?.role_code || 0);
}

function obtenerHomePorRol(user = {}) {
    return obtenerRolUsuario(user) === 4 ? "home.html" : "home_employees.html";
}

function resolverRedireccionPostLogin(user = {}) {
    const fallbackRedirect = obtenerRedireccionLogin();
    const roleCode = obtenerRolUsuario(user);

    if (roleCode > 0) {
        return obtenerHomePorRol(user);
    }

    return fallbackRedirect || DEFAULT_LOGIN_REDIRECT;
}

async function procesarRetornoGoogle() {
    const url = new URL(globalThis.location.href);
    const params = url.searchParams;

    if (!params.has("success") && !params.has("access_token") && !params.has("message")) {
        return false;
    }

    const success = params.get("success") === "1";
    const accessToken = params.get("access_token") || "";
    const userPayload = params.get("user") || "";
    const message = params.get("message") || "";

    url.search = "";
    window.history.replaceState({}, document.title, url.toString());

    if (!success || accessToken === "") {
        limpiarSesionLocal();
        await window.HgaAlerts.error(message || "No fue posible autenticar con Google");
        return true;
    }

    limpiarSesionLocal();
    guardarSesion({
        accessToken,
        tokenType: params.get("token_type") || "Bearer",
        expiresIn: params.get("expires_in") || "",
        user: parsearUsuario(userPayload),
    });

    await window.HgaAlerts.success(message || "Login exitoso con Google");
    const loginRedirectUrl = new URL(resolverRedireccionPostLogin(parsearUsuario(userPayload)), globalThis.location.href);
    globalThis.location.replace(loginRedirectUrl.toString());
    return true;
}

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
            limpiarSesionLocal();
            const mensaje = data.message || "No fue posible iniciar sesion";
            await window.HgaAlerts.error(mensaje, "No fue posible iniciar sesion");
            return;
        }

        limpiarSesionLocal();
        guardarSesion({
            accessToken: data.access_token || "",
            tokenType: data.token_type || "Bearer",
            expiresIn: data.expires_in || "",
            user: data.user || {},
        });
        await window.HgaAlerts.success("Login exitoso");
        const loginRedirectUrl = new URL(resolverRedireccionPostLogin(data.user || {}), globalThis.location.href);
        globalThis.location.replace(loginRedirectUrl.toString());
    } catch (error) {
        console.error("Error al iniciar sesion:", error);
        limpiarSesionLocal();
        await window.HgaAlerts.error("Error al conectar con el servidor");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await procesarRetornoGoogle();

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

function obtenerRedireccionLogin() {
    const redirect = document.body?.dataset?.loginRedirect?.trim();
    return redirect || DEFAULT_LOGIN_REDIRECT;
}

function limpiarSesionLocal() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("usuario");
}

function guardarSesion({ accessToken = "", tokenType = "Bearer", expiresIn = "", user = {} }) {
    if (accessToken) {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("authToken", accessToken);
    }

    if (tokenType) {
        localStorage.setItem("token_type", tokenType);
    }

    if (expiresIn !== "") {
        localStorage.setItem("expires_in", String(expiresIn));
    }

    guardarUsuario(user);
}

function guardarUsuario(user) {
    if (!user) {
        return;
    }

    try {
        const normalizedUser = typeof user === "string" ? parsearUsuario(user) : user;
        if (!normalizedUser || (typeof normalizedUser === "object" && Object.keys(normalizedUser).length === 0)) {
            return;
        }
        localStorage.setItem("usuario", JSON.stringify(normalizedUser));
    } catch (error) {
        console.error("No fue posible guardar el usuario autenticado:", error);
    }
}

function parsearUsuario(payload) {
    if (!payload) {
        return {};
    }

    const decodedPayload = safeDecodeURIComponent(payload);

    try {
        return JSON.parse(decodedPayload);
    } catch {
        return { raw: decodedPayload };
    }
}

function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
