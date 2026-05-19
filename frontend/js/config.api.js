/**
 * Configuración de conexión al backend
 * Modifica esta configuración según tu ambiente
 */

const API_CONFIG = {
    BACKEND_URL: window.HGA_API_BASE_URL || window.location.origin,
};

// 🔗 Endpoints de API
export const ENDPOINTS = {
    REGISTER: `${API_CONFIG.BACKEND_URL}/api/register`,
    LOGIN: `${API_CONFIG.BACKEND_URL}/api/login`,
    LOGOUT: `${API_CONFIG.BACKEND_URL}/api/logout`,
    USER_PROFILE: `${API_CONFIG.BACKEND_URL}/api/user`,
    DASHBOARD_DATA: `${API_CONFIG.BACKEND_URL}/api/dashboard`,
};

// ⚙️ Opciones por defecto para fetch
export const DEFAULT_FETCH_OPTIONS = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
};

// 🔒 Información de CORS
export const CORS_INFO = {
    descripcion: "Si obtienes errores de CORS, necesitas configurar el backend",
    documentacion: "Consulta CONFIGURACION_SETUP.md en la carpeta backend/",
    comando: "composer require fruitcake/laravel-cors",
};

export default API_CONFIG;
