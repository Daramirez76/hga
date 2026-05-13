const FORGOT_PASSWORD_ENDPOINT = "/api/user/forgot_password";
const DEFAULT_RETURN_TO = "login.html";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");
    const statusMessage = document.getElementById("statusMessage");
    const submitButton = document.getElementById("submitButton");
    const backLink = document.getElementById("backLink");

    if (!form || !emailInput || !statusMessage || !submitButton) {
        return;
    }

    const returnTo = obtenerDestinoRetorno();
    if (backLink) {
        backLink.href = returnTo;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarEstado(statusMessage, emailInput);

        const email = emailInput.value.trim();
        if (!email) {
            mostrarEstado(statusMessage, "Ingresa tu correo electrónico.", "error");
            emailInput.classList.add("is-invalid");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Enviando enlace...";

        try {
            const response = await fetch(FORGOT_PASSWORD_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify({
                    email,
                    return_to: returnTo,
                }),
            });

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const body = await response.text();
                throw new Error(`Respuesta no JSON (${response.status}). Posible redirección inesperada. ${body.slice(0, 140)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                mostrarEstado(
                    statusMessage,
                    obtenerMensajeError(data) || "No fue posible procesar la solicitud.",
                    "error"
                );
                emailInput.classList.add("is-invalid");
                return;
            }

            mostrarEstado(
                statusMessage,
                data.mensaje || "Si el correo está registrado, recibirás un enlace de recuperación.",
                "success"
            );
        } catch (error) {
            console.error("Error al solicitar recuperación de contraseña:", error);
            mostrarEstado(
                statusMessage,
                "Error al conectar con el servidor.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar enlace de recuperación";
        }
    });
});

function obtenerDestinoRetorno() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = (params.get("return_to") || DEFAULT_RETURN_TO).trim();
    const allowed = new Set(["login.html", "login_employees.html"]);

    return allowed.has(returnTo) ? returnTo : DEFAULT_RETURN_TO;
}

function mostrarEstado(elemento, mensaje, tipo) {
    elemento.textContent = mensaje;
    elemento.className = `status-message show ${tipo}`;
}

function limpiarEstado(elemento, emailInput) {
    elemento.textContent = "";
    elemento.className = "status-message";
    emailInput.classList.remove("is-invalid");
}

function obtenerMensajeError(data) {
    if (!data || typeof data !== "object") {
        return "";
    }

    if (typeof data.message === "string") {
        return data.message;
    }

    if (typeof data.error === "string") {
        return data.error;
    }

    if (data.errors && typeof data.errors === "object") {
        if (Array.isArray(data.errors.email) && data.errors.email.length > 0) {
            return data.errors.email.join(", ");
        }
    }

    if (Array.isArray(data.email) && data.email.length > 0) {
        return data.email.join(", ");
    }

    if (typeof data.detail === "string") {
        return data.detail;
    }

    return "";
}
