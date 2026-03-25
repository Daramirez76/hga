(function (global) {
    let loaderPromise = null;

    function loadSwal() {
        if (global.Swal) {
            return Promise.resolve(global.Swal);
        }

        if (loaderPromise) {
            return loaderPromise;
        }

        loaderPromise = new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
            script.async = true;
            script.onload = () => resolve(global.Swal || null);
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        });

        return loaderPromise;
    }

    async function fire(options) {
        const Swal = await loadSwal();

        if (Swal) {
            return Swal.fire({
                confirmButtonColor: "#299c4c",
                cancelButtonColor: "#6c757d",
                ...options,
            });
        }

        const message = options.text || options.title || "";

        if (options.input) {
            const value = global.prompt(message, options.inputValue || "");
            return { isConfirmed: value !== null, value };
        }

        if (options.showCancelButton) {
            return { isConfirmed: global.confirm(message) };
        }

        global.alert(message);
        return { isConfirmed: true };
    }

    async function success(message, title = "Exito") {
        return fire({
            icon: "success",
            title,
            text: message,
        });
    }

    async function error(message, title = "Error") {
        return fire({
            icon: "error",
            title,
            text: message,
        });
    }

    async function warning(message, title = "Atencion") {
        return fire({
            icon: "warning",
            title,
            text: message,
        });
    }

    async function info(message, title = "Informacion") {
        return fire({
            icon: "info",
            title,
            text: message,
        });
    }

    async function confirm(message, title = "Confirmar") {
        const result = await fire({
            icon: "warning",
            title,
            text: message,
            showCancelButton: true,
            confirmButtonText: "Aceptar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
        });

        return Boolean(result.isConfirmed);
    }

    async function prompt(message, options = {}) {
        const Swal = await loadSwal();

        if (Swal) {
            return Swal.fire({
                title: options.title || "Ingresa un valor",
                text: message,
                input: options.input || "text",
                inputValue: options.inputValue || "",
                inputLabel: options.inputLabel,
                inputPlaceholder: options.inputPlaceholder || "",
                inputAttributes: options.inputAttributes || {},
                showCancelButton: true,
                confirmButtonText: options.confirmButtonText || "Aceptar",
                cancelButtonText: options.cancelButtonText || "Cancelar",
                reverseButtons: true,
                confirmButtonColor: "#299c4c",
                cancelButtonColor: "#6c757d",
                inputValidator: options.inputValidator,
            });
        }

        const value = global.prompt(message, options.inputValue || "");
        return { isConfirmed: value !== null, value };
    }

    global.HgaAlerts = {
        fire,
        success,
        error,
        warning,
        info,
        confirm,
        prompt,
    };

    loadSwal();
})(window);
