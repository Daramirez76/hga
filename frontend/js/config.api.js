/**
 * Configuración de conexión al backend
 * Modifica esta configuración según tu ambiente
 */

// ⚙️ DESARROLLO (Backend en mismo servidor)
const API_CONFIG = {
    // Usa mismo origen para evitar problemas de host/puerto en local y entornos remotos
    BACKEND_URL: window.location.origin,
    
    // Alternativas comunes:
    // BACKEND_URL: "http://app:8000",           // Docker interno
    // BACKEND_URL: "https://api.ejemplo.com",  // Producción
};

// 🔗 Endpoints de API
export const ENDPOINTS = {
    REGISTER: `${API_CONFIG.BACKEND_URL}/api/register`,
    LOGIN: `${API_CONFIG.BACKEND_URL}/api/login`,
    LOGOUT: `${API_CONFIG.BACKEND_URL}/api/logout`,
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
