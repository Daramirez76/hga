(() => {
  const LEGACY_STORAGE_KEY = "hga_chatbot_messages";
  const STORAGE_KEY_PREFIX = "hga_chatbot_messages";
  const CHATBOT_URL = `${window.location.origin}/chatbot-api/chat`;
  const MAX_STORED_MESSAGES = 30;

  const state = {
    isOpen: false,
    isSending: false,
    messages: [],
  };

  function getConversationStorageKey() {
    const storedUser = getStoredUser();
    const userId =
      storedUser?.doc_id ||
      storedUser?.id ||
      storedUser?.usuario ||
      document.body?.dataset?.roleCode ||
      "guest";

    return `${STORAGE_KEY_PREFIX}:${String(userId).trim() || "guest"}`;
  }

  function loadMessages() {
    try {
      const storageKey = getConversationStorageKey();
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        return parsed;
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      const legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : [];

      if (Array.isArray(legacyParsed)) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(legacyParsed.slice(-MAX_STORED_MESSAGES))
        );
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        return legacyParsed;
      }

      return [];
    } catch {
      return [];
    }
  }

  function saveMessages() {
    window.localStorage.setItem(
      getConversationStorageKey(),
      JSON.stringify(state.messages.slice(-MAX_STORED_MESSAGES))
    );
  }

  function buildAuthHeaders(authToken) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    return headers;
  }

  function getAuthToken() {
    const token =
      window.localStorage.getItem("access_token") ||
      window.localStorage.getItem("authToken") ||
      "";

    return token.trim() || null;
  }

  function getStoredUser() {
    try {
      const raw = window.localStorage.getItem("usuario");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getCurrentRoleCode() {
    const storedUser = getStoredUser();
    const storedRole = Number(storedUser?.cod_rol || storedUser?.role_code || 0);

    if (storedRole > 0) {
      return storedRole;
    }

    const bodyRole = Number(document.body?.dataset?.roleCode || 0);
    return bodyRole > 0 ? bodyRole : 0;
  }

  function normalizeHistory(history, maxItems = 8, maxLength = 240) {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .slice(-maxItems)
      .map((message) => ({
        role: message?.role === "bot" ? "bot" : "user",
        content: String(message?.content || "").trim().slice(0, maxLength),
      }))
      .filter((message) => message.content.length > 0);
  }

  function shouldRenderChatbot() {
    const token = getAuthToken();
    const roleCode = getCurrentRoleCode();
    return Boolean(token) && roleCode === 4;
  }

  function createStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .hga-chatbot-shell {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 9999;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        isolation: isolate;
        line-height: normal;
        color: #183329;
        direction: ltr;
      }

      .hga-chatbot-shell,
      .hga-chatbot-shell *,
      .hga-chatbot-shell *::before,
      .hga-chatbot-shell *::after {
        box-sizing: border-box;
        font-family: inherit;
      }

      .hga-chatbot-toggle {
        width: 64px;
        height: 64px;
        appearance: none;
        -webkit-appearance: none;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #1f7a5a, #2ba36a);
        color: #fff;
        box-shadow: 0 16px 32px rgba(15, 57, 42, 0.28);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        line-height: 1;
        text-align: center;
        text-decoration: none;
        min-width: 64px !important;
        max-width: 64px !important;
        padding: 0 !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        width: 64px !important;
      }

      .hga-chatbot-toggle svg {
        width: 28px;
        height: 28px;
        display: block;
      }

      .hga-chatbot-toggle.is-hidden {
        display: none;
      }

      .hga-chatbot-toggle:hover {
        transform: translateY(-2px);
      }

      .hga-chatbot-panel {
        width: min(360px, calc(100vw - 32px));
        height: min(560px, calc(100vh - 110px));
        margin-top: 16px;
        border-radius: 24px;
        overflow: hidden;
        background: #f7fbf8;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(31, 122, 90, 0.15);
        display: none;
        flex-direction: column;
      }

      .hga-chatbot-panel.is-open {
        display: flex;
      }

      .hga-chatbot-header {
        padding: 18px 20px;
        background: linear-gradient(135deg, #123d2f, #1f7a5a);
        color: #fff;
      }

      .hga-chatbot-header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .hga-chatbot-header-copy {
        flex: 1;
      }

      .hga-chatbot-minimize {
        width: 36px;
        height: 36px;
        appearance: none;
        -webkit-appearance: none;
        border: none;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        min-width: 36px !important;
        max-width: 36px !important;
        padding: 0 !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        width: 36px !important;
      }

      .hga-chatbot-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        text-align: left !important;
        color: #fff !important;
        text-transform: none !important;
      }

      .hga-chatbot-subtitle {
        margin: 6px 0 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .hga-chatbot-messages {
        flex: 1;
        padding: 18px;
        overflow-y: auto;
        background:
          radial-gradient(circle at top, rgba(43, 163, 106, 0.08), transparent 38%),
          #f7fbf8;
      }

      .hga-chatbot-message {
        max-width: 86%;
        margin-bottom: 12px;
        padding: 12px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.45;
        white-space: pre-wrap;
      }

      .hga-chatbot-message.user {
        margin-left: auto;
        background: #1f7a5a;
        color: #fff;
        border-bottom-right-radius: 6px;
      }

      .hga-chatbot-message.bot {
        margin-right: auto;
        background: #ffffff;
        color: #183329;
        border: 1px solid rgba(24, 51, 41, 0.08);
        border-bottom-left-radius: 6px;
      }

      .hga-chatbot-form {
        padding: 14px;
        background: #ffffff;
        border-top: 1px solid rgba(24, 51, 41, 0.08);
      }

      .hga-chatbot-input-wrap {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        width: 100%;
      }

      .hga-chatbot-input {
        flex: 1 1 auto;
        appearance: none;
        -webkit-appearance: none;
        resize: none;
        min-height: 52px;
        max-height: 120px;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(31, 122, 90, 0.2);
        background: #f7fbf8;
        color: #183329;
        font-size: 14px;
        line-height: 1.45;
        outline: none;
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
        text-transform: none !important;
        letter-spacing: normal !important;
      }

      .hga-chatbot-submit {
        appearance: none;
        -webkit-appearance: none;
        border: none;
        border-radius: 14px;
        background: #1f7a5a;
        color: #fff;
        padding: 12px 16px;
        font-weight: 600;
        cursor: pointer;
        line-height: 1.2;
        text-align: center;
        width: auto !important;
        min-width: 88px !important;
        max-width: 140px !important;
        flex: 0 0 auto !important;
        text-transform: none !important;
        letter-spacing: normal !important;
      }

      .hga-chatbot-submit:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      .hga-chatbot-note {
        margin-top: 10px;
        font-size: 12px;
        color: #55776a;
      }

      @media (max-width: 640px) {
        .hga-chatbot-shell {
          right: 16px;
          bottom: 16px;
          left: 16px;
        }

        .hga-chatbot-toggle {
          margin-left: auto;
          display: flex;
        }

        .hga-chatbot-panel {
          width: 100%;
          height: min(70vh, 560px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderMessages(container) {
    container.innerHTML = "";

    const messages = state.messages.length
      ? state.messages
      : [
          {
            role: "bot",
            content: "Hola, soy el asistente virtual de HGA.",
          },
        ];

    for (const message of messages) {
      const item = document.createElement("div");
      item.className = `hga-chatbot-message ${message.role}`;
      item.textContent = message.content;
      container.appendChild(item);
    }

    container.scrollTop = container.scrollHeight;
  }

  function pushMessage(role, content, messagesContainer) {
    state.messages.push({ role, content });
    saveMessages();
    renderMessages(messagesContainer);
  }

  async function sendMessage(text, messagesContainer, submitButton) {
    state.isSending = true;
    submitButton.disabled = true;

    try {
      const historySnapshot = normalizeHistory(state.messages);
      const isFirstMessage = state.messages.length === 0;
      const authToken = getAuthToken();

      pushMessage("user", text, messagesContainer);

      const response = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: buildAuthHeaders(authToken),
        body: JSON.stringify({
          message: text,
          is_first_message: isFirstMessage,
          history: historySnapshot,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Chatbot request failed with ${response.status}`;

        try {
          const errorPayload = await response.json();
          if (typeof errorPayload?.detail === "string") {
            errorMessage = errorPayload.detail;
          } else if (typeof errorPayload?.detail?.message === "string") {
            errorMessage = errorPayload.detail.message;
          }
        } catch {
          errorMessage = `Chatbot request failed with ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      const payload = await response.json();
      pushMessage("bot", payload.reply || "No pude generar una respuesta en este momento.", messagesContainer);
    } catch (error) {
      const fallbackMessage =
        error instanceof Error && error.message
          ? error.message
          : "No pude comunicarme con el asistente en este momento. Intenta nuevamente en un momento.";

      pushMessage(
        "bot",
        fallbackMessage,
        messagesContainer
      );
    } finally {
      state.isSending = false;
      submitButton.disabled = false;
    }
  }

  function buildChatbot() {
    state.messages = loadMessages();
    createStyles();

    const shell = document.createElement("div");
    shell.className = "hga-chatbot-shell";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "hga-chatbot-toggle";
    toggle.setAttribute("aria-label", "Abrir asistente virtual");
    toggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 3a5 5 0 0 0-4.546 2.914A4 4 0 0 0 4 13h8a4 4 0 0 0 .546-7.086A5 5 0 0 0 8 3m0-1a6 6 0 0 1 5.196 3.001A5 5 0 0 1 12 14H4a5 5 0 0 1-1.196-8.999A6 6 0 0 1 8 2"/>
        <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
      </svg>
    `;

    const panel = document.createElement("section");
    panel.className = "hga-chatbot-panel";

    function setPanelOpen(nextValue) {
      state.isOpen = nextValue;
      panel.classList.toggle("is-open", state.isOpen);
      toggle.classList.toggle("is-hidden", state.isOpen);
      toggle.setAttribute("aria-expanded", String(state.isOpen));

      if (state.isOpen) {
        textarea.focus();
      }
    }

    const header = document.createElement("div");
    header.className = "hga-chatbot-header";
    header.innerHTML = `
      <div class="hga-chatbot-header-row">
        <div class="hga-chatbot-header-copy">
          <h2 class="hga-chatbot-title">Asistente HGA</h2>
          <p class="hga-chatbot-subtitle">Resuelve las preguntas que tengas sobre el hogar geriatrico.</p>
        </div>
        <button type="button" class="hga-chatbot-minimize" aria-label="Minimizar chat">−</button>
      </div>
    `;

    const messages = document.createElement("div");
    messages.className = "hga-chatbot-messages";

    const form = document.createElement("form");
    form.className = "hga-chatbot-form";

    const inputWrap = document.createElement("div");
    inputWrap.className = "hga-chatbot-input-wrap";

    const textarea = document.createElement("textarea");
    textarea.className = "hga-chatbot-input";
    textarea.name = "message";
    textarea.rows = 1;
    textarea.placeholder = "Escribe tu mensaje...";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "hga-chatbot-submit";
    submit.textContent = "Enviar";

    const note = document.createElement("div");
    note.className = "hga-chatbot-note";
    note.textContent = "El chatbot es una IA y puede cometer errores.";

    inputWrap.appendChild(textarea);
    inputWrap.appendChild(submit);
    form.appendChild(inputWrap);
    form.appendChild(note);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(form);

    shell.appendChild(toggle);
    shell.appendChild(panel);
    document.body.appendChild(shell);

    renderMessages(messages);

    const minimizeButton = header.querySelector(".hga-chatbot-minimize");

    toggle.addEventListener("click", () => {
      setPanelOpen(!state.isOpen);
    });

    minimizeButton?.addEventListener("click", () => {
      setPanelOpen(false);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = textarea.value.trim();

      if (!text || state.isSending) {
        return;
      }

      textarea.value = "";
      await sendMessage(text, messages, submit);
      textarea.focus();
    });

    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (shouldRenderChatbot()) {
        buildChatbot();
      }
    });
  } else {
    if (shouldRenderChatbot()) {
      buildChatbot();
    }
  }
})();
