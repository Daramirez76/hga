const HOME_API_ME_ENDPOINT = `${window.location.origin}/api/me`;
let googleProfileWizard = null;

function readStoredHomeUser() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeHomeUser(userData) {
  const user = userData || {};

  return {
    id: user.id || "",
    name: String(user.name || user.nombre || "").trim(),
    apellido: String(user.apellido || "").trim(),
    tipoDoc: String(user.tipo_doc || user.tipoDoc || "").trim(),
    docId: Number(user.doc_id || user.docId || 0),
    email: String(user.email || "").trim(),
    username: String(user.username || user.usuario || "").trim(),
    telefono: String(user.telefono || "").trim(),
    direccion: String(user.direccion || "").trim(),
    edad: Number(user.edad || 0),
    googleId: String(user.google_id || "").trim(),
    profileCompleted: Boolean(user.profile_completed),
  };
}

async function fetchCurrentHomeUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    window.location.href = "login.html";
    return null;
  }

  try {
    const response = await fetch(HOME_API_ME_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.user) {
      localStorage.setItem("usuario", JSON.stringify(data.user));
      return data.user;
    }
  } catch (error) {
    console.error("No fue posible cargar el usuario actual:", error);
  }

  return null;
}

function getMissingGoogleProfileFields(user) {
  const missingFields = [];

  if (!user.tipoDoc) {
    missingFields.push("tipo_doc");
  }

  if (!Number.isFinite(user.docId) || user.docId <= 0) {
    missingFields.push("doc_id");
  }

  if (!user.name) {
    missingFields.push("name");
  }

  if (!user.apellido) {
    missingFields.push("apellido");
  }

  if (!user.telefono || user.telefono === "0") {
    missingFields.push("telefono");
  }

  if (!user.direccion) {
    missingFields.push("direccion");
  }

  if (!Number.isFinite(user.edad) || user.edad < 18) {
    missingFields.push("edad");
  }

  return missingFields;
}

function shouldPromptGoogleProfile(user) {
  if (!user || !user.googleId) {
    return false;
  }

  if (user.profileCompleted) {
    return false;
  }

  return getMissingGoogleProfileFields(user).length > 0;
}

function fillGoogleProfileForm(user) {
  const form = document.getElementById("googleProfileForm");

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.elements.tipo_doc.value = user.tipoDoc || "";
  form.elements.doc_id.value = "";
  form.elements.name.value = user.name || "";
  form.elements.apellido.value = user.apellido || "";
  form.elements.telefono.value = user.telefono && user.telefono !== "0" ? user.telefono : "";
  form.elements.direccion.value = user.direccion || "";
  form.elements.edad.value = user.edad >= 18 ? String(user.edad) : "";
}

function setGoogleProfileModalVisible(isVisible) {
  const modal = document.getElementById("googleProfileModal");

  if (!(modal instanceof HTMLElement)) {
    return;
  }

  modal.classList.toggle("show", isVisible);
  modal.setAttribute("aria-hidden", String(!isVisible));
  document.body.style.overflow = isVisible ? "hidden" : "";
}

function setGoogleProfileError(message) {
  const errorBox = document.getElementById("googleProfileError");

  if (!(errorBox instanceof HTMLElement)) {
    return;
  }

  errorBox.textContent = message || "";
  errorBox.classList.toggle("show", Boolean(message));
}

function buildGoogleProfilePayload(form) {
  const formData = new FormData(form);
  const docId = normalizeGoogleProfileDigits(String(formData.get("doc_id") || ""));

  return {
    tipo_doc: String(formData.get("tipo_doc") || "").trim(),
    doc_id: Number(docId),
    name: String(formData.get("name") || "").trim(),
    apellido: String(formData.get("apellido") || "").trim(),
    telefono: String(formData.get("telefono") || "").trim(),
    direccion: String(formData.get("direccion") || "").trim(),
    edad: Number(String(formData.get("edad") || "").trim()),
  };
}

function normalizeGoogleProfileDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function validateGoogleProfileStep(payload, step) {
  if (step === 1) {
    if (!payload.tipo_doc) {
      return "Selecciona un tipo de documento.";
    }

    if (!Number.isInteger(payload.doc_id) || payload.doc_id <= 0) {
      return "Ingresa un número de documento válido.";
    }
  }

  if (step === 2) {
    if (!payload.name || !payload.apellido) {
      return "Completa nombre y apellido.";
    }

    if (!Number.isFinite(payload.edad) || payload.edad < 18 || payload.edad > 120) {
      return "Ingresa una edad válida entre 18 y 120 años.";
    }
  }

  if (step === 3) {
    if (!payload.direccion || !payload.telefono) {
      return "Completa dirección y teléfono.";
    }

    if (!/^[\d\s()+-]+$/.test(payload.telefono)) {
      return "Ingresa un teléfono válido.";
    }
  }

  return "";
}

function validateGoogleProfilePayload(payload) {
  const validationSteps = [1, 2, 3];

  for (const step of validationSteps) {
    const validationMessage = validateGoogleProfileStep(payload, step);
    if (validationMessage) {
      return {
        message: validationMessage,
        step,
      };
    }
  }

  return {
    message: "",
    step: 1,
  };
}

async function saveGoogleProfile(payload) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(HOME_API_ME_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const firstValidationEntry = Object.entries(data.errors || {}).find(([, messages]) =>
      Array.isArray(messages) && messages.length > 0
    );
    const validationErrors = Object.values(data.errors || {}).flat().filter(Boolean);
    const error = new Error(validationErrors[0] || data.message || "No fue posible guardar el perfil.");
    error.field = firstValidationEntry ? firstValidationEntry[0] : "";
    throw error;
  }

  return {
    user: data.user || null,
    accessToken: data.access_token || "",
  };
}

async function handleGoogleProfileFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = document.getElementById("googleProfileSubmit");

  if (!(form instanceof HTMLFormElement) || !(submitButton instanceof HTMLButtonElement)) {
    return;
  }

  const payload = buildGoogleProfilePayload(form);
  const validationResult = validateGoogleProfilePayload(payload);

  if (validationResult.message) {
    if (googleProfileWizard) {
      googleProfileWizard.goToStep(validationResult.step);
    }
    setGoogleProfileError(validationResult.message);
    return;
  }

  setGoogleProfileError("");
  submitButton.disabled = true;
  submitButton.textContent = "Guardando...";

  try {
    const result = await saveGoogleProfile(payload);

    if (result.accessToken) {
      localStorage.setItem("access_token", result.accessToken);
    }

    if (result.user) {
      localStorage.setItem("usuario", JSON.stringify(result.user));
    }

    setGoogleProfileModalVisible(false);
  } catch (error) {
    console.error("No fue posible completar el perfil:", error);
    if (googleProfileWizard && error instanceof Error && error.field) {
      googleProfileWizard.goToStep(getGoogleProfileStepFromField(error.field));
    }
    setGoogleProfileError(error instanceof Error ? error.message : "No fue posible guardar los datos.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Guardar datos";
  }
}

function getGoogleProfileStepFromField(field) {
  if (field === "tipo_doc" || field === "doc_id") {
    return 1;
  }

  if (field === "name" || field === "apellido" || field === "edad") {
    return 2;
  }

  return 3;
}

function initGoogleProfileWizard() {
  if (googleProfileWizard) {
    return googleProfileWizard;
  }

  const form = document.getElementById("googleProfileForm");
  const panes = Array.from(document.querySelectorAll("[data-profile-step-pane]"));
  const indicators = Array.from(document.querySelectorAll("[data-profile-step-indicator]"));
  const lines = Array.from(document.querySelectorAll("[data-profile-step-line]"));
  const message = document.getElementById("googleProfileStepMessage");
  const nextButton = document.getElementById("googleProfileNext");
  const prevButton = document.getElementById("googleProfilePrev");
  const submitButton = document.getElementById("googleProfileSubmit");

  if (!(form instanceof HTMLFormElement)) {
    return null;
  }

  let currentStep = 1;
  const totalSteps = panes.length || 1;
  const messages = {
    1: "Paso 1 de 3: ingresa tu tipo y número de documento.",
    2: "Paso 2 de 3: completa tu nombre, apellido y edad.",
    3: "Paso 3 de 3: agrega tu dirección y teléfono.",
  };

  function render() {
    panes.forEach((pane) => {
      const step = Number(pane.dataset.profileStepPane);
      pane.hidden = step !== currentStep;
    });

    indicators.forEach((indicator) => {
      const step = Number(indicator.dataset.profileStepIndicator);
      indicator.classList.toggle("is-active", step === currentStep);
      indicator.classList.toggle("is-complete", step < currentStep);
    });

    lines.forEach((line) => {
      const step = Number(line.dataset.profileStepLine);
      line.classList.toggle("is-complete", step < currentStep);
    });

    if (message) {
      message.textContent = messages[currentStep] || "";
    }

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.hidden = currentStep === 1;
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.hidden = currentStep === totalSteps;
    }

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.hidden = currentStep !== totalSteps;
    }
  }

  function goToStep(step) {
    currentStep = Math.max(1, Math.min(totalSteps, Number(step) || 1));
    render();

    const firstField = document.querySelector(`[data-profile-step-pane="${currentStep}"] input, [data-profile-step-pane="${currentStep}"] select`);
    if (firstField instanceof HTMLElement) {
      firstField.focus();
    }
  }

  if (nextButton instanceof HTMLButtonElement && !nextButton.dataset.bound) {
    nextButton.addEventListener("click", () => {
      const payload = buildGoogleProfilePayload(form);
      const validationMessage = validateGoogleProfileStep(payload, currentStep);

      if (validationMessage) {
        setGoogleProfileError(validationMessage);
        return;
      }

      setGoogleProfileError("");
      goToStep(currentStep + 1);
    });
    nextButton.dataset.bound = "true";
  }

  if (prevButton instanceof HTMLButtonElement && !prevButton.dataset.bound) {
    prevButton.addEventListener("click", () => {
      setGoogleProfileError("");
      goToStep(currentStep - 1);
    });
    prevButton.dataset.bound = "true";
  }

  render();
  googleProfileWizard = { goToStep };
  return googleProfileWizard;
}

async function initGoogleProfileModal() {
  const form = document.getElementById("googleProfileForm");
  const wizard = initGoogleProfileWizard();

  if (form instanceof HTMLFormElement && !form.dataset.bound) {
    form.addEventListener("submit", handleGoogleProfileFormSubmit);
    form.dataset.bound = "true";
  }

  const storedUser = normalizeHomeUser(readStoredHomeUser());
  let user = storedUser;

  const freshUser = await fetchCurrentHomeUser();
  if (freshUser) {
    user = normalizeHomeUser(freshUser);
  }

  if (!user.id && !user.email) {
    return;
  }

  if (!shouldPromptGoogleProfile(user)) {
    return;
  }

  fillGoogleProfileForm(user);
  setGoogleProfileError("");
  if (wizard) {
    wizard.goToStep(1);
  }
  setGoogleProfileModalVisible(true);
}

document.addEventListener("DOMContentLoaded", () => {
  initGoogleProfileModal();
});
