const LOGIN_ENDPOINT = `${window.location.origin}/api/login`;

function validarFormulario() {
    const email = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    if (email === "") {
        alert("El correo o usuario no puede estar vacío");
        return false;
    }

    if (contrasena === "") {
        alert("La contraseña no puede estar vacía");
        return false;
    }

    return true;
}

async function iniciarSesion(event) {
    event.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const email = document.getElementById("usuario").value.trim();
    const password = document.getElementById("contrasena").value.trim();
    const datos = {
        email,
        password,
    };

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify(datos),
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            const body = await response.text();
            throw new Error(`Respuesta no JSON (${response.status}). Posible redirección inesperada. ${body.slice(0, 140)}`);
        }

        const data = await response.json();

        if (!response.ok) {
            const mensaje = data.message || "No fue posible iniciar sesión";
            alert(`Error: ${mensaje}`);
            return;
        }

        if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
        }
        localStorage.setItem("usuario", JSON.stringify(data.user));
        alert("Login exitoso");
        window.location.href = "main_page(user).html";
    } catch (error) {
        console.error("Error al iniciar sesion:", error);
        alert("Error al conectar con el servidor");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("loginForm");
    if (formulario) {
        formulario.addEventListener("submit", iniciarSesion);
    }
});
