(function (global) {
  const ACTIVIDADES_API_URL = `${global.location.origin}/api/actividades`;
  const CITAS_API_URL = `${global.location.origin}/api/citas`;
  const VISITAS_API_URL = `${global.location.origin}/api/visitas`;

  const MONTH_NAMES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const state = {
    initialized: false,
    mode: "tutor",
    monthView: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDateKey: "",
    events: [],
  };

  function getToken() {
    return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
  }

  function getLoginPage() {
    return document.body?.dataset?.loginPage?.trim() || "login.html";
  }

  function getCalendarMode() {
    return document.body?.dataset?.calendarScope?.trim() || "tutor";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function redirectToLogin() {
    if (global.HgaRoleAccess && typeof global.HgaRoleAccess.redirectToLogin === "function") {
      global.HgaRoleAccess.redirectToLogin();
      return;
    }

    global.location.href = getLoginPage();
  }

  async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  async function requestJson(url) {
    const token = getToken();

    if (!token) {
      redirectToLogin();
      throw new Error("No hay una sesión activa.");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await readJsonResponse(response);

    if (response.status === 401) {
      redirectToLogin();
      throw new Error("Sesión expirada.");
    }

    if (!response.ok) {
      throw new Error(data.message || `Error HTTP ${response.status}`);
    }

    return Array.isArray(data.data) ? data.data : [];
  }

  function normalizeDateKey(value) {
    const normalized = String(value || "").trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
  }

  function parseDate(dateKey) {
    if (!dateKey) {
      return null;
    }

    const parsed = new Date(`${dateKey}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function parseDateLabel(dateKey) {
    const parsed = parseDate(dateKey);

    if (!parsed) {
      return "Fecha pendiente";
    }

    return parsed.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function formatTimeLabel(value) {
    return String(value || "").trim().slice(0, 5);
  }

  function toInteger(value) {
    const parsed = Number.parseInt(String(value ?? "").trim(), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function monthKey(dateKey) {
    return normalizeDateKey(dateKey).slice(0, 7);
  }

  function normalizeActividad(item) {
    return {
      type: "actividad",
      typeLabel: "Actividad",
      id: String(item?.Cod_acti_ludi ?? item?.cod_acti_ludi ?? item?.id ?? ""),
      dateKey: normalizeDateKey(item?.Fecha),
      title: String(item?.Nombre ?? "").trim() || "Actividad lúdica",
      timeLabel: [formatTimeLabel(item?.Hora_ini), formatTimeLabel(item?.Hora_fin)].filter(Boolean).join(" - "),
      detail: String(item?.Lugar ?? "").trim() || "Actividad general del hogar",
      sortHint: formatTimeLabel(item?.Hora_ini) || "23:59",
    };
  }

  function normalizeCita(item) {
    const acompanante = String(item?.Nombre_acompañante ?? item?.Nombre_acompanante ?? "").trim();
    const lugar = String(item?.Lugar_cita ?? "").trim();

    return {
      type: "cita",
      typeLabel: "Cita",
      id: String(item?.cod_cita ?? item?.codCita ?? item?.id ?? ""),
      dateKey: normalizeDateKey(item?.Fecha_cita),
      title: "Cita médica",
      timeLabel: [formatTimeLabel(item?.hora_inicio), formatTimeLabel(item?.hora_fin)].filter(Boolean).join(" - "),
      detail: [acompanante, lugar].filter(Boolean).join(" · ") || "Cita médica programada",
      sortHint: formatTimeLabel(item?.hora_inicio) || "23:58",
    };
  }

  function normalizeVisita(item) {
    const visitante = String(item?.Nomb_visitante ?? item?.title ?? "").trim();
    const residentCode = toInteger(item?.cod_Residente ?? item?.cod_residente);
    
    // Obtener horarios si están disponibles
    const horaInicio = formatTimeLabel(item?.hora_inicio);
    const horaFin = formatTimeLabel(item?.hora_fin);
    const timeLabel = (horaInicio && horaFin) 
      ? `${horaInicio} - ${horaFin}`
      : (horaInicio || "");

    return {
      type: "visita",
      typeLabel: "Visita",
      id: String(item?.id ?? item?.cod_Visitas ?? ""),
      dateKey: normalizeDateKey(item?.Fecha_Visita),
      title: visitante ? `Visita de ${visitante}` : "Visita programada",
      timeLabel: timeLabel,
      detail: residentCode > 0 ? `Residente #${residentCode}` : "Visita registrada",
      sortHint: horaInicio || "23:57",
    };
  }

  function sortEvents(items) {
    return items.slice().sort((left, right) => {
      const byDate = left.dateKey.localeCompare(right.dateKey);
      if (byDate !== 0) {
        return byDate;
      }

      const byTime = left.sortHint.localeCompare(right.sortHint);
      if (byTime !== 0) {
        return byTime;
      }

      return left.title.localeCompare(right.title);
    });
  }

  function monthEvents() {
    const currentMonthKey = `${state.monthView.getFullYear()}-${String(state.monthView.getMonth() + 1).padStart(2, "0")}`;
    return sortEvents(state.events.filter((item) => monthKey(item.dateKey) === currentMonthKey));
  }

  function selectedDayEvents() {
    if (!state.selectedDateKey) {
      return [];
    }

    return sortEvents(state.events.filter((item) => item.dateKey === state.selectedDateKey));
  }

  function groupEventsByDate(items) {
    const map = new Map();

    items.forEach((item) => {
      if (!item.dateKey) {
        return;
      }

      const current = map.get(item.dateKey) || [];
      current.push(item);
      map.set(item.dateKey, sortEvents(current));
    });

    return map;
  }

  function getElements() {
    return {
      dayStrip: document.querySelector(".hga-day-strip, .calendar-strip"),
      heading: document.getElementById("calendarHeading"),
      description: document.getElementById("calendarDescription"),
      monthLabel: document.getElementById("mesActual"),
      previousButton: document.getElementById("btnMesAnterior"),
      nextButton: document.getElementById("btnMesSiguiente"),
      grid: document.getElementById("calendarioGrid"),
      eventsTitle: document.getElementById("calendarEventsTitle"),
      eventsDescription: document.getElementById("calendarEventsDescription"),
      eventsList: document.getElementById("listaNovedad"),
    };
  }

  function updateCopy() {
    const elements = getElements();

    if (elements.heading instanceof HTMLElement) {
      elements.heading.textContent = state.mode === "staff" ? "Agenda del hogar" : "Agenda del residente";
    }

    if (elements.description instanceof HTMLElement) {
      elements.description.textContent = state.mode === "staff"
        ? "Consulta las actividades lúdicas programadas por el hogar geriátrico."
        : "Consulta las fechas de citas médicas, visitas y actividades lúdicas del hogar.";
    }
  }

  function updateStrip() {
    const elements = getElements();

    if (!(elements.dayStrip instanceof HTMLElement)) {
      return;
    }

    const today = new Date();
    const todayLabel = today.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const total = monthEvents().length;
    const summary = total === 1 ? "1 evento este mes" : `${total} eventos este mes`;
    elements.dayStrip.textContent = `${todayLabel} · ${summary}`;
  }

  function createDots(events) {
    const wrapper = document.createElement("div");
    wrapper.className = "celda-eventos";

    Array.from(new Set(events.map((item) => item.type))).slice(0, 3).forEach((type) => {
      const dot = document.createElement("span");
      dot.className = `evento-dot ${type}`;
      wrapper.appendChild(dot);
    });

    return wrapper;
  }

  function renderCalendar() {
    const elements = getElements();

    if (!(elements.grid instanceof HTMLElement) || !(elements.monthLabel instanceof HTMLElement)) {
      return;
    }

    elements.grid.innerHTML = "";

    const year = state.monthView.getFullYear();
    const month = state.monthView.getMonth();
    elements.monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    let offset = new Date(year, month, 1).getDay();
    offset = offset === 0 ? 6 : offset - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayKey = normalizeDateKey(new Date().toISOString());
    const eventMap = groupEventsByDate(monthEvents());

    for (let index = 0; index < offset; index += 1) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "celda-dia is-empty";
      elements.grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const events = eventMap.get(dateKey) || [];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "celda-dia";

      if (dateKey === todayKey) {
        cell.classList.add("hoy");
      }

      if (dateKey === state.selectedDateKey) {
        cell.classList.add("seleccionado");
      }

      const number = document.createElement("span");
      number.className = "num-dia";
      number.textContent = String(day);
      cell.appendChild(number);

      if (events.length > 0) {
        const summary = document.createElement("div");
        summary.className = "celda-resumen";
        summary.appendChild(createDots(events));

        const label = document.createElement("span");
        label.className = "celda-label";
        label.textContent = events.length === 1 ? "1 evento" : `${events.length} eventos`;
        summary.appendChild(label);
        cell.appendChild(summary);
      }

      cell.addEventListener("click", () => {
        state.selectedDateKey = state.selectedDateKey === dateKey ? "" : dateKey;
        renderCalendar();
        renderEvents();
      });

      elements.grid.appendChild(cell);
    }
  }

  function renderEvents() {
    const elements = getElements();

    if (!(elements.eventsList instanceof HTMLElement)) {
      return;
    }

    const selected = selectedDayEvents();
    const items = selected.length > 0 ? selected : monthEvents();

    if (elements.eventsTitle instanceof HTMLElement) {
      elements.eventsTitle.textContent = selected.length > 0 ? "Eventos del día" : "Eventos del mes";
    }

    if (elements.eventsDescription instanceof HTMLElement) {
      elements.eventsDescription.textContent = selected.length > 0
        ? parseDateLabel(state.selectedDateKey)
        : "Selecciona un día del calendario para ver su detalle.";
    }

    elements.eventsList.innerHTML = "";

    if (items.length === 0) {
      const emptyItem = document.createElement("div");
      emptyItem.className = "novedad-item vacia";
      emptyItem.textContent = "No hay eventos programados para este periodo.";
      elements.eventsList.appendChild(emptyItem);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "novedad-item";
      card.innerHTML = `
        <div class="novedad-meta">
          <span class="novedad-tipo ${item.type}">${item.typeLabel}</span>
          <span>${parseDateLabel(item.dateKey)}</span>
          ${item.timeLabel ? `<span>${escapeHtml(item.timeLabel)}</span>` : ""}
        </div>
        <h3 class="novedad-titulo">${escapeHtml(item.title)}</h3>
        <p class="novedad-detalle">${escapeHtml(item.detail)}</p>
      `;
      elements.eventsList.appendChild(card);
    });
  }

  /**
   * Obtiene visitas para el mes actual desde el endpoint calendar
   * El endpoint es sensible al rol: Admin ve todas, tutores ven solo sus visitas
   */
  async function getVisitasForMonth() {
    try {
      // Calcular rango de fechas del mes actual
      const monthStart = new Date(state.monthView.getFullYear(), state.monthView.getMonth(), 1);
      const monthEnd = new Date(state.monthView.getFullYear(), state.monthView.getMonth() + 1, 0);
      
      const startDate = monthStart.toISOString().slice(0, 10);
      const endDate = monthEnd.toISOString().slice(0, 10);
      
      // Llamar al endpoint calendar (funciona para ambos roles)
      return await requestJson(`${VISITAS_API_URL}/calendar?start=${startDate}&end=${endDate}`);
    } catch (error) {
      console.warn("Error al obtener visitas del calendario:", error);
      return [];
    }
  }

  async function loadEvents() {
    const requests = [
      requestJson(ACTIVIDADES_API_URL),
      state.mode === "tutor" ? requestJson(CITAS_API_URL) : Promise.resolve([]),
      // SINCRONIZACIÓN: Todos (admin y tutores) obtienen visitas del endpoint calendar
      getVisitasForMonth(),
    ];

    const [activitiesResult, citasResult, visitasResult] = await Promise.allSettled(requests);
    const items = [];

    if (activitiesResult.status === "fulfilled") {
      items.push(...activitiesResult.value.map(normalizeActividad));
    }

    if (citasResult.status === "fulfilled") {
      items.push(...citasResult.value.map(normalizeCita));
    }

    if (visitasResult.status === "fulfilled") {
      items.push(...visitasResult.value.map(normalizeVisita));
    }

    state.events = sortEvents(items.filter((item) => item.dateKey));
  }

  function bindControls() {
    const elements = getElements();

    if (elements.previousButton instanceof HTMLButtonElement) {
      elements.previousButton.addEventListener("click", async () => {
        state.monthView.setMonth(state.monthView.getMonth() - 1);
        state.monthView = new Date(state.monthView.getFullYear(), state.monthView.getMonth(), 1);
        state.selectedDateKey = "";
        updateStrip();
        renderCalendar();
        // SINCRONIZACIÓN: Recargar eventos cuando se navega a otro mes
        await loadEvents();
        renderEvents();
      });
    }

    if (elements.nextButton instanceof HTMLButtonElement) {
      elements.nextButton.addEventListener("click", async () => {
        state.monthView.setMonth(state.monthView.getMonth() + 1);
        state.monthView = new Date(state.monthView.getFullYear(), state.monthView.getMonth(), 1);
        state.selectedDateKey = "";
        updateStrip();
        renderCalendar();
        // SINCRONIZACIÓN: Recargar eventos cuando se navega a otro mes
        await loadEvents();
        renderEvents();
      });
    }
  }

  async function init() {
    if (state.initialized) {
      return;
    }

    const elements = getElements();

    if (!(elements.grid instanceof HTMLElement)) {
      return;
    }

    state.initialized = true;
    state.mode = getCalendarMode();
    updateCopy();
    bindControls();

    if (elements.eventsList instanceof HTMLElement) {
      elements.eventsList.innerHTML = '<div class="novedad-item vacia">Cargando eventos del calendario...</div>';
    }

    try {
      await loadEvents();
    } catch {
      if (elements.eventsList instanceof HTMLElement) {
        elements.eventsList.innerHTML = '<div class="novedad-item vacia">No fue posible cargar el calendario.</div>';
      }
      return;
    }

    updateStrip();
    renderCalendar();
    renderEvents();
  }

  global.HgaHomeCalendar = {
    init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void init();
    });
  } else {
    void init();
  }
})(window);
