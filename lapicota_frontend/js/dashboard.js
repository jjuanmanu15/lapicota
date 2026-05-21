import { loadAndRenderAllFromCSVs, buildUIControls } from './analisis/analisis.js';

const elementoEstado = document.getElementById('dashboardStatus');
const themeToggleBtn = document.getElementById('themeToggle');

// Colores para las gráficas
const colors = {
    primary: '#3b82f6',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#0ea5e9',
    purple: '#a855f7',
    pink: '#ec4899',
    cyan: '#06b6d4',
    lime: '#84cc16'
};

function setKPI(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadDashboard() {
    if (elementoEstado) elementoEstado.textContent = 'Cargando datos desde CSV...';
    try {
        // intenta cargar los CSVs desde rutas típicas; la función retorna métricas resumidas
        const metrics = await loadAndRenderAllFromCSVs();

        setKPI('totalPresos', metrics.totalPresos || 0);
        setKPI('totalGuardias', metrics.totalGuardias || 0);
        setKPI('totalIncidentes', metrics.totalIncidentes || 0);
        setKPI('totalVisitas', metrics.totalVisitas || 0);

        if (elementoEstado) elementoEstado.textContent = 'Datos cargados desde CSV';
    } catch (error) {
        console.error(error);
        if (elementoEstado) elementoEstado.textContent = 'Error cargando CSVs';
    }
}

function getCurrentTheme() {
    return localStorage.getItem('lapicotaTheme') || 'light';
}

function applyTheme(mode) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${mode}-mode`);
    localStorage.setItem('lapicotaTheme', mode);
}

function toggleTheme() {
    const current = getCurrentTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

window.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    // inicializar controles para CSVs
    try { buildUIControls(); } catch (e) { /* ignore */ }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    applyTheme(getCurrentTheme());
});