(function (global) {
  const config = {
    BACKEND_URL: "https://hga-backend-12345.azurewebsites.net",
    CHATBOT_URL: "https://hga-chatbot-12345.azurewebsites.net/chat",
  };

  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function normalizePath(path) {
    const cleanPath = String(path || "");
    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  }

  const backendUrl = trimTrailingSlash(config.BACKEND_URL);
  const chatbotUrl = String(config.CHATBOT_URL || "").trim();

  global.HGA_API_CONFIG = config;
  global.HGA_API_BASE_URL = backendUrl || global.location.origin;
  global.HGA_CHATBOT_URL = chatbotUrl || `${global.location.origin}/chatbot-api/chat`;
  global.HGA_API_URL = function (path) {
    return `${global.HGA_API_BASE_URL}${normalizePath(path)}`;
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('a[href^="/api/"]').forEach(function (link) {
      link.href = global.HGA_API_URL(link.getAttribute("href"));
    });
  });
})(window);
