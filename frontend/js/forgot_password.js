const FORGOT_PASSWORD_ENDPOINT = "/api/user/forgot_password/";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");
    const statusMessage = document.getElementById("statusMessage");
    const submitButton = document.getElementById("submitButton");

    if (!form || !emailInput || !statusMessage || !submitButton) {
        return;
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
        submitButton.textContent = "Enviando...";

        try {
            const response = await fetch(FORGOT_PASSWORD_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

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
                data.mensaje || "Solicitud enviada correctamente.",
                "success"
            );
            form.reset();
            setTimeout(() => {
                window.location.href = `reset_password.html?email=${encodeURIComponent(email)}`;
            }, 1200);
        } catch (error) {
            console.error("Error al solicitar recuperación de contraseña:", error);
            mostrarEstado(
                statusMessage,
                "Error al conectar con el servidor.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar solicitud";
        }
    });
});

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

    if (typeof data.error === "string") {
        return data.error;
    }

    if (Array.isArray(data.email) && data.email.length > 0) {
        return data.email.join(", ");
    }

    if (typeof data.detail === "string") {
        return data.detail;
    }

    return "";
}
