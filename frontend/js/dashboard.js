const API_BASE = `${window.location.origin}/api`;
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const PIE_COLORS = ['#8dd3c7', '#f7cf7c', '#9cc7ff', '#f7a8a8', '#c7e89e', '#c8b4f6', '#f3c38f'];
const RESOURCE_CONFIG = {
  residentes: { endpoint: '/residentes', label: 'Residentes', countLabel: 'residentes', dateKeys: ['created_at'] },
  medicamentos: { endpoint: '/medicamentos', label: 'Medicamentos', countLabel: 'registros', dateKeys: ['fecha_entrada', 'fecha_novedad', 'created_at'] },
  actividades: { endpoint: '/actividades', label: 'Actividades Ludicas', countLabel: 'registros', dateKeys: ['Fecha', 'created_at'] },
  citas: { endpoint: '/citas', label: 'Citas Medicas', countLabel: 'registros', dateKeys: ['Fecha_cita', 'created_at'] },
  visitas: { endpoint: '/visitas', label: 'Visitas', countLabel: 'registros', dateKeys: ['Fecha_Visita', 'created_at'] },
  informes: { endpoint: '/informes', label: 'Informes', countLabel: 'registros', dateKeys: ['created_at', 'updated_at'] }
};

const monthFilter = document.getElementById('monthFilter');
const moduleFilter = document.getElementById('moduleFilter');
const statusBanner = document.getElementById('statusBanner');
const lineChartStage = document.getElementById('lineChartStage');
const pieChartStage = document.getElementById('pieChartStage');
const pieLegend = document.getElementById('pieLegend');
const trendTitle = document.getElementById('trendTitle');
const trendCaption = document.getElementById('trendCaption');
const pieCaption = document.getElementById('pieCaption');

const dashboardState = {
  currentUser: null,
  resources: { residentes: [], medicamentos: [], actividades: [], citas: [], visitas: [], informes: [] },
  failedResources: []
};

function getStoredToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('authToken') || '';
}

function showStatus(message) {
  if (!message) {
    statusBanner.textContent = '';
    statusBanner.classList.remove('show');
    return;
  }
  statusBanner.textContent = message;
  statusBanner.classList.add('show');
}

function setLoadingState() {
  showStatus('Cargando datos del dashboard...');
}

function fillMonthFilter() {
  const currentMonth = new Date().getMonth() + 1;
  monthFilter.innerHTML = '<option value="all">Mes</option>';
  MONTH_NAMES.forEach((monthName, index) => {
    const value = String(index + 1).padStart(2, '0');
    const option = document.createElement('option');
    option.value = value;
    option.textContent = monthName;
    if (index + 1 === currentMonth) option.selected = true;
    monthFilter.appendChild(option);
  });
}

function buildHeaders() {
  const token = getStoredToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson(path, method = 'GET') {
  const response = await fetch(`${API_BASE}${path}`, { method, headers: buildHeaders() });
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
    throw new Error('Sesion expirada');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Error HTTP ${response.status}`);
  return data;
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function parsePossibleDate(rawValue) {
  if (!rawValue) return null;
  if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) return rawValue;
  const normalized = String(rawValue).trim();
  if (!normalized) return null;
  const directDate = new Date(normalized);
  if (!Number.isNaN(directDate.getTime())) return directDate;
  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const composed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
    if (!Number.isNaN(composed.getTime())) return composed;
  }
  return null;
}

function extractItemDate(item, explicitKeys) {
  const fallbackKeys = [...(explicitKeys || []), 'created_at', 'updated_at', 'fecha', 'Fecha', 'fecha_entrada', 'fecha_novedad', 'Fecha_cita', 'Fecha_Visita'];
  for (const key of fallbackKeys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      const parsed = parsePossibleDate(item[key]);
      if (parsed) return parsed;
    }
  }
  return null;
}

function filterCollectionByMonth(items, dateKeys, monthValue) {
  if (monthValue === 'all') return items;
  const targetMonth = Number(monthValue);
  return items.filter((item) => {
    const date = extractItemDate(item, dateKeys);
    if (!date) return true;
    return date.getMonth() + 1 === targetMonth;
  });
}
function countUniqueActiveUsers(resources, currentUser) {
  const userIds = new Set();
  const userKeys = ['cod_usuario', 'doc_id', 'id'];
  Object.values(resources).forEach((collection) => {
    collection.forEach((item) => {
      userKeys.forEach((key) => {
        const value = item ? item[key] : null;
        if (value !== null && value !== undefined && String(value).trim() !== '') userIds.add(String(value));
      });
    });
  });
  if (currentUser && currentUser.id) userIds.add(String(currentUser.id));
  return userIds.size;
}

function formatCount(count, label) {
  return `${count} ${count === 1 ? label.replace(/s$/, '') : label}`;
}

function updateMetricCard(metricKey, percent, count, detailText) {
  const valueNode = document.getElementById(`metric-${metricKey}-value`);
  const countNode = document.getElementById(`metric-${metricKey}-count`);
  const detailNode = document.getElementById(`metric-${metricKey}-detail`);
  const fallbackLabel = metricKey === 'usuarios' ? 'usuarios' : 'registros';
  const config = RESOURCE_CONFIG[metricKey];
  const label = config ? config.countLabel : fallbackLabel;
  if (valueNode) valueNode.textContent = `${percent}%`;
  if (countNode) countNode.textContent = formatCount(count, label);
  if (detailNode) detailNode.textContent = detailText;
}

function buildSnapshot(monthValue) {
  const filteredResources = {};
  Object.entries(RESOURCE_CONFIG).forEach(([key, config]) => {
    filteredResources[key] = filterCollectionByMonth(dashboardState.resources[key] || [], config.dateKeys, monthValue);
  });
  const metrics = {
    residentes: filteredResources.residentes.length,
    medicamentos: filteredResources.medicamentos.length,
    actividades: filteredResources.actividades.length,
    citas: filteredResources.citas.length,
    visitas: filteredResources.visitas.length,
    usuarios: countUniqueActiveUsers(filteredResources, dashboardState.currentUser),
    informes: filteredResources.informes.length
  };
  return { filteredResources, metrics };
}

function renderMetrics(snapshot, monthValue) {
  const metricValues = Object.values(snapshot.metrics);
  const maxValue = Math.max(...metricValues, 1);
  const monthLabel = monthValue === 'all' ? 'vista global' : MONTH_NAMES[Number(monthValue) - 1];
  const historyLabel = monthValue === 'all' ? 'total historico' : `mes de ${monthLabel.toLowerCase()}`;
  Object.entries(snapshot.metrics).forEach(([key, count]) => {
    const percent = Math.round((count / maxValue) * 100);
    const detailText = key === 'usuarios'
      ? (monthValue === 'all' ? 'usuarios detectados' : `usuarios activos en ${monthLabel.toLowerCase()}`)
      : historyLabel;
    updateMetricCard(key, percent, count, detailText);
  });
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderLineChart(moduleKey, monthValue) {
  const months = [];
  const currentDate = new Date();
  currentDate.setDate(1);
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - offset, 1);
    months.push({ label: MONTH_NAMES[date.getMonth()].slice(0, 3), month: date.getMonth(), year: date.getFullYear() });
  }

  const hasSpecificModule = moduleKey !== 'all';
  const chartResources = hasSpecificModule ? { [moduleKey]: dashboardState.resources[moduleKey] || [] } : dashboardState.resources;
  const targetKeys = hasSpecificModule ? [moduleKey] : ['medicamentos', 'actividades', 'citas', 'visitas', 'informes'];
  const activeKeys = targetKeys.filter((key) => key !== 'usuarios');
  const chartTitle = hasSpecificModule ? (RESOURCE_CONFIG[moduleKey]?.label || 'Modulo') : 'Actividad mensual';
  trendTitle.textContent = hasSpecificModule ? `Actividad mensual - ${chartTitle}` : 'Actividad mensual';
  trendCaption.textContent = monthValue === 'all' ? 'Ultimos 6 meses' : `Contexto del filtro: ${MONTH_NAMES[Number(monthValue) - 1]}`;

  const series = months.map((monthInfo) => activeKeys.reduce((accumulator, key) => {
    const items = chartResources[key] || [];
    const dateKeys = RESOURCE_CONFIG[key] ? RESOURCE_CONFIG[key].dateKeys : [];
    const count = items.filter((item) => {
      const itemDate = extractItemDate(item, dateKeys);
      return itemDate && itemDate.getMonth() === monthInfo.month && itemDate.getFullYear() === monthInfo.year;
    }).length;
    return accumulator + count;
  }, 0));

  if (!series.some((value) => value > 0)) {
    lineChartStage.innerHTML = '<div class="chart-empty">No hay fechas suficientes para graficar este modulo.</div>';
    return;
  }

  const width = 520;
  const height = 190;
  const padding = { top: 18, right: 18, bottom: 34, left: 34 };
  const maxValue = Math.max(...series, 1);
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const points = series.map((value, index) => {
    const x = padding.left + (usableWidth / Math.max(series.length - 1, 1)) * index;
    const y = padding.top + usableHeight - (value / maxValue) * usableHeight;
    return { x, y, value, label: months[index].label };
  });
  const pointList = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaList = `${padding.left},${height - padding.bottom} ${pointList} ${width - padding.right},${height - padding.bottom}`;
  const axisLabels = months.map((month, index) => `<text x="${points[index].x}" y="${height - 12}" text-anchor="middle" font-size="10" fill="#5f7074">${month.label}</text>`).join('');
  const pointMarkers = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3.5" fill="#ffffff" stroke="#2a4f56" stroke-width="2"></circle><text x="${point.x}" y="${point.y - 10}" text-anchor="middle" font-size="10" fill="#2a4f56">${point.value}</text>`).join('');

  lineChartStage.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafico de actividad mensual"><line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#c1d8d6" stroke-width="1.5"></line><line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#c1d8d6" stroke-width="1.5"></line><polygon points="${areaList}" fill="rgba(53, 191, 210, 0.16)"></polygon><polyline points="${pointList}" fill="none" stroke="#2a4f56" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>${axisLabels}${pointMarkers}</svg>`;
}
function renderPieChart(snapshot, monthValue) {
  const entries = Object.entries(snapshot.metrics)
    .filter(([key]) => key !== 'usuarios')
    .map(([key, value]) => ({ key, label: RESOURCE_CONFIG[key]?.label || key, value }))
    .filter((entry) => entry.value > 0);

  const monthLabel = monthValue === 'all' ? 'historial completo' : MONTH_NAMES[Number(monthValue) - 1];
  pieCaption.textContent = `Participacion del periodo: ${monthLabel}`;

  if (!entries.length) {
    pieChartStage.innerHTML = '<div class="chart-empty">No hay datos para construir la distribucion del periodo.</div>';
    pieLegend.innerHTML = '';
    return;
  }

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const radius = 72;
  const centerX = 170;
  const centerY = 96;
  let startAngle = -Math.PI / 2;

  const slices = entries.map((entry, index) => {
    const fraction = entry.value / total;
    const endAngle = startAngle + fraction * Math.PI * 2;
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    const path = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`, 'Z'].join(' ');
    const fill = PIE_COLORS[index % PIE_COLORS.length];
    startAngle = endAngle;
    return { ...entry, fill, fraction, path };
  });

  pieChartStage.innerHTML = `<svg viewBox="0 0 340 190" role="img" aria-label="Grafico circular por modulo">${slices.map((slice) => `<path d="${slice.path}" fill="${slice.fill}" stroke="#ffffff" stroke-width="1.5"></path>`).join('')}<circle cx="${centerX}" cy="${centerY}" r="36" fill="rgba(255,255,255,0.9)"></circle><text x="${centerX}" y="${centerY - 2}" text-anchor="middle" font-size="12" fill="#32565c">Total</text><text x="${centerX}" y="${centerY + 16}" text-anchor="middle" font-size="16" font-weight="700" fill="#244a50">${total}</text></svg>`;
  pieLegend.innerHTML = slices.map((slice) => `<div class="legend-item"><span class="legend-dot" style="background:${slice.fill}"></span><span>${escapeHtml(slice.label)}: ${slice.value} (${Math.round(slice.fraction * 100)}%)</span></div>`).join('');
}

function renderDashboard() {
  const monthValue = monthFilter.value || 'all';
  const moduleValue = moduleFilter.value || 'all';
  const snapshot = buildSnapshot(monthValue);
  renderMetrics(snapshot, monthValue);
  renderLineChart(moduleValue, monthValue);
  renderPieChart(snapshot, monthValue);
  if (dashboardState.failedResources.length) {
    showStatus(`Algunos modulos no se cargaron: ${dashboardState.failedResources.join(', ')}.`);
  } else {
    showStatus('');
  }
}

async function loadCurrentUser() {
  const storedUser = localStorage.getItem('usuario');
  if (storedUser) {
    try {
      dashboardState.currentUser = JSON.parse(storedUser);
    } catch {
      dashboardState.currentUser = null;
    }
  }
  try {
    const response = await fetchJson('/me');
    if (response && response.user) {
      dashboardState.currentUser = response.user;
      localStorage.setItem('usuario', JSON.stringify(response.user));
    }
  } catch (error) {
    if (!dashboardState.currentUser) throw error;
  }
}

async function loadResources() {
  const entries = Object.entries(RESOURCE_CONFIG);
  const results = await Promise.allSettled(entries.map(async ([key, config]) => {
    const payload = await fetchJson(config.endpoint);
    return { key, items: normalizeCollection(payload) };
  }));

  dashboardState.failedResources = [];
  results.forEach((result, index) => {
    const [key, config] = entries[index];
    if (result.status === 'fulfilled') {
      dashboardState.resources[key] = result.value.items;
    } else {
      dashboardState.resources[key] = [];
      dashboardState.failedResources.push(config.label);
      console.error(`No se pudo cargar ${key}:`, result.reason);
    }
  });
}

async function logoutSession() {
  const token = getStoredToken();
  if (token) {
    try {
      await fetchJson('/logout', 'POST');
    } catch (error) {
      console.warn('No se pudo cerrar la sesion en el backend.', error);
    }
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

async function initializeDashboard() {
  const token = getStoredToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  fillMonthFilter();
  if (window.HgaUserMenu) {
    window.HgaUserMenu.init({ onLogout: logoutSession });
  }
  monthFilter.addEventListener('change', renderDashboard);
  moduleFilter.addEventListener('change', renderDashboard);
  setLoadingState();
  try {
    await loadCurrentUser();
    await loadResources();
    renderDashboard();
  } catch (error) {
    console.error('No se pudo inicializar el dashboard:', error);
    showStatus('No fue posible cargar el dashboard. Verifica que el backend este activo y que la sesion siga vigente.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
