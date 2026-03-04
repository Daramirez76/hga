const LOGIN_ENDPOINT = "/api/user/login/";

function validarFormulario() {
    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    if (usuario === "") {
        alert("El usuario no puede estar vacio");
        return false;
    }

    if (contrasena === "") {
        alert("La contraseña no puede estar vacia");
        return false;
    }

    return true;
}

async function iniciarSesion(event) {
    event.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();
    const datos = {
        usuario,
        contraseña: contrasena,
    };

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
            const mensaje = data.error || "No fue posible iniciar sesion";
            alert(`Error: ${mensaje}`);
            return;
        }

        localStorage.setItem("usuario", JSON.stringify(data));
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
