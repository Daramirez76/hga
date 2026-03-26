const RESET_PASSWORD_ENDPOINT = "/api/user/forgot_password/reset";
const DEFAULT_RETURN_TO = "login.html";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const emailInput = document.getElementById("email");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const submitButton = document.getElementById("submitButton");
    const statusMessage = document.getElementById("statusMessage");
    const resetTokenInput = document.getElementById("resetToken");
    const returnToInput = document.getElementById("returnTo");
    const backLink = document.getElementById("backLink");
    const secondaryLink = document.getElementById("secondaryLink");

    if (!form || !emailInput || !newPasswordInput || !confirmPasswordInput || !submitButton || !statusMessage) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = (params.get("token") || "").trim();
    const email = (params.get("email") || "").trim();
    const returnTo = obtenerDestinoRetorno(params.get("return_to"));

    if (backLink) {
        backLink.href = returnTo;
    }

    if (secondaryLink) {
        secondaryLink.href = `forgot_password.html?return_to=${encodeURIComponent(returnTo)}`;
    }

    if (returnToInput) {
        returnToInput.value = returnTo;
    }

    if (resetTokenInput) {
        resetTokenInput.value = token;
    }

    if (!token || !email) {
        mostrarEstado(
            statusMessage,
            "Este enlace de recuperación no es válido o expiró. Solicita uno nuevo desde el formulario de recuperación.",
            "error"
        );
        submitButton.disabled = true;
        newPasswordInput.disabled = true;
        confirmPasswordInput.disabled = true;
        emailInput.readOnly = true;
        if (!email) {
            emailInput.value = "";
        }
        return;
    }

    emailInput.value = email;
    emailInput.readOnly = true;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarEstado(statusMessage, [emailInput, newPasswordInput, confirmPasswordInput]);

        const nuevaContraseña = newPasswordInput.value.trim();
        const confirmarContraseña = confirmPasswordInput.value.trim();
        const mensajeError = validarFormulario(email, token, nuevaContraseña, confirmarContraseña);

        if (mensajeError) {
            mostrarEstado(statusMessage, mensajeError, "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Actualizando...";

        try {
            const response = await fetch(RESET_PASSWORD_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify({
                    email,
                    token,
                    nueva_contraseña: nuevaContraseña,
                    confirmar_contraseña: confirmarContraseña,
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
                    obtenerMensajeError(data) || "No fue posible actualizar la contraseña.",
                    "error"
                );
                return;
            }

            mostrarEstado(
                statusMessage,
                data.mensaje || "Contraseña actualizada exitosamente. Redirigiendo al inicio de sesión...",
                "success"
            );

            setTimeout(() => {
                window.location.href = returnTo;
            }, 1500);
        } catch (error) {
            console.error("Error al restablecer contraseña:", error);
            mostrarEstado(statusMessage, "Error al conectar con el servidor.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Actualizar contraseña";
        }
    });
});

function obtenerDestinoRetorno(returnTo) {
    const normalized = (returnTo || DEFAULT_RETURN_TO).trim();
    const allowed = new Set(["login.html", "login_employees.html"]);

    return allowed.has(normalized) ? normalized : DEFAULT_RETURN_TO;
}

function validarFormulario(email, token, nuevaContraseña, confirmarContraseña) {
    if (!email) {
        return "Ingresa tu correo electrónico.";
    }

    if (!token) {
        return "Este enlace de recuperación no es válido o expiró.";
    }

    if (!nuevaContraseña || !confirmarContraseña) {
        return "Debes completar ambos campos de contraseña.";
    }

    if (nuevaContraseña.length < 8) {
        return "La nueva contraseña debe tener al menos 8 caracteres.";
    }

    if (nuevaContraseña !== confirmarContraseña) {
        return "Las contraseñas no coinciden.";
    }

    return "";
}

function mostrarEstado(elemento, mensaje, tipo) {
    elemento.textContent = mensaje;
    elemento.className = `status-message show ${tipo}`;
}

function limpiarEstado(elemento, inputs) {
    elemento.textContent = "";
    elemento.className = "status-message";
    inputs.forEach((input) => input.classList.remove("is-invalid"));
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

    if (typeof data.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
        return data.non_field_errors.join(", ");
    }

    if (data.errors && typeof data.errors === "object") {
        for (const clave of ["email", "token", "nueva_contraseña", "confirmar_contraseña"]) {
            if (Array.isArray(data.errors[clave]) && data.errors[clave].length > 0) {
                return data.errors[clave].join(", ");
            }
        }
    }

    for (const clave of ["email", "token", "nueva_contraseña", "confirmar_contraseña"]) {
        if (Array.isArray(data[clave]) && data[clave].length > 0) {
            return data[clave].join(", ");
        }
    }

    return "";
}
