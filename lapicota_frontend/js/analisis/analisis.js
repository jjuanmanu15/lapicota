// Utilidades para cargar y parsear CSVs con PapaParse
async function tryFetchText(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } catch (e) {
        return null;
    }
}

async function fetchCsvWithFallback(paths) {
    for (const p of paths) {
        const txt = await tryFetchText(p);
        if (txt !== null) return { txt, url: p };
    }
    throw new Error('No se pudo obtener CSV desde ninguna ruta');
}

function parseCsvText(csvText) {
    return Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
}

function safeEl(id) {
    return document.getElementById(id) || null;
}

function formatName(first, last) {
    if (!first && !last) return 'Desconocido';
    return [first, last].filter(Boolean).join(' ');
}

// Renderizado de gráficas específicas usando los CSVs en entrega_lapicota
export async function loadAndRenderAllFromCSVs(opts = {}) {
    const { baseCandidates = ['/lapicota_frontend/entrega_lapicota/', './entrega_lapicota/', '../entrega_lapicota/'], topN = 10 } = opts;
    // lista de archivos y mapping a elementos/cálculos
    const files = {
        topPresos: '01_top_presos_incidentes.csv',
        incidentesTipo: '02_incidentes_por_tipo.csv',
        incidentesPatio: '03_incidentes_por_patio.csv',
        visitasEstado: '04_visitas_por_estado.csv',
        incidentesTurno: '05_incidentes_por_turno.csv',
        evolucionMensual: '06_evolucion_mensual.csv',
        topGuardias: '07_top_guardias_incidentes.csv',
        delitos: '08_incidentes_por_delito.csv'
    };

    // helper para intentar varias rutas
    const makePaths = (name) => baseCandidates.map(b => b + name);

    const metrics = {
        totalPresos: 0,
        totalGuardias: 0,
        totalIncidentes: 0,
        totalVisitas: 0
    };

    // 1) Top presos -> incidentesPorPresoChart
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.topPresos));
        const data = parseCsvText(txt);
        metrics.totalPresos = data.length;
        const labels = data.map(r => formatName(r.preso_nombres, r.preso_apellidos));
        const values = data.map(r => r.total_incidentes || 0);
        const ctx = safeEl('incidentesPorPresoChart');
        if (ctx) {
            if (window._chart_incidentesPorPreso) window._chart_incidentesPorPreso.destroy();
            window._chart_incidentesPorPreso = new Chart(ctx, {
                type: 'bar',
                data: { labels: labels.slice(0, topN), datasets: [{ label: 'Incidentes', data: values.slice(0, topN), backgroundColor: '#ef4444' }] },
                options: { responsive: true, maintainAspectRatio: true }
            });
        }
    } catch (e) {
        console.warn('topPresos CSV not loaded:', e.message);
    }

    // 2) Incidentes por tipo -> incidentesPorTipoChart (crear si existe)
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.incidentesTipo));
        const data = parseCsvText(txt);
        const labels = data.map(r => r.incidente_tipo);
        const values = data.map(r => r.total || r.total_incidentes || 0);
        const ctx = safeEl('incidentesPorTipoChart');
        if (ctx) {
            if (window._chart_incidentesPorTipo) window._chart_incidentesPorTipo.destroy();
            window._chart_incidentesPorTipo = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Incidentes por tipo', data: values, backgroundColor: '#f97316' }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('incidentesTipo CSV not loaded:', e.message); }

    // 3) Incidentes por patio -> incidentesPorPatioChart
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.incidentesPatio));
        const data = parseCsvText(txt);
        const labels = data.map(r => r.preso_patio || r.patio);
        const values = data.map(r => r.total_incidentes || r.total || 0);
        const ctx = safeEl('incidentesPorPatioChart');
        if (ctx) {
            if (window._chart_incidentesPorPatio) window._chart_incidentesPorPatio.destroy();
            window._chart_incidentesPorPatio = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Incidentes por patio', data: values, backgroundColor: '#06b6d4' }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('incidentesPatio CSV not loaded:', e.message); }

    // 4) Visitas por estado -> visitasEstadoChart
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.visitasEstado));
        const data = parseCsvText(txt);
        const labels = data.map(r => (r.visita_estado || r.estado || r.estado_visita || '').toString());
        const values = data.map(r => r.total || r.total_visitas || 0);
        metrics.totalVisitas = values.reduce((a, b) => a + (Number(b) || 0), 0);
        const ctx = safeEl('visitasEstadoChart');
        if (ctx) {
            if (window._chart_visitasEstado) window._chart_visitasEstado.destroy();
            window._chart_visitasEstado = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: labels.map((_, i) => `hsl(${i * 40 % 360} 80% 60%)`) }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('visitasEstado CSV not loaded:', e.message); }

    // 5) Incidentes por turno -> incidentesPorTurnoChart
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.incidentesTurno));
        const data = parseCsvText(txt);
        const labels = data.map(r => r.guardia_turno || r.turno || r.turno_guardia);
        const values = data.map(r => r.total_incidentes || r.total || 0);
        const ctx = safeEl('incidentesPorTurnoChart');
        if (ctx) {
            if (window._chart_incidentesPorTurno) window._chart_incidentesPorTurno.destroy();
            window._chart_incidentesPorTurno = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ data: values, backgroundColor: ['#22c55e', '#f59e0b', '#a855f7'] }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('incidentesTurno CSV not loaded:', e.message); }

    // 6) Evolución mensual -> visitasPorFechaChart (usaremos total_incidentes y periodos)
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.evolucionMensual));
        const data = parseCsvText(txt);
        const labels = data.map(r => r.periodo || `${r.anio}-${r.mes}`);
        const valoresInc = data.map(r => r.total_incidentes || 0);
        const valoresVis = data.map(r => r.total_visitas || 0);
        metrics.totalIncidentes = valoresInc.reduce((a, b) => a + (Number(b) || 0), 0);
        const ctx = safeEl('visitasPorFechaChart');
        if (ctx) {
            if (window._chart_visitasPorFecha) window._chart_visitasPorFecha.destroy();
            window._chart_visitasPorFecha = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Incidentes', data: valoresInc, borderColor: '#ef4444', fill: false }, { label: 'Visitas', data: valoresVis, borderColor: '#22c55e', fill: false }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('evolucionMensual CSV not loaded:', e.message); }

    // 7) Top guardias -> topGuardiasChart
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.topGuardias));
        const data = parseCsvText(txt);
        metrics.totalGuardias = data.length;
        const labels = data.map(r => formatName(r.guardia_nombres, r.guardia_apellidos));
        const values = data.map(r => r.total_incidentes || 0);
        const ctx = safeEl('topGuardiasChart');
        if (ctx) {
            if (window._chart_topGuardias) window._chart_topGuardias.destroy();
            window._chart_topGuardias = new Chart(ctx, { type: 'bar', data: { labels: labels.slice(0, topN), datasets: [{ label: 'Incidentes', data: values.slice(0, topN), backgroundColor: '#a855f7' }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('topGuardias CSV not loaded:', e.message); }

    // 8) Incidentes por delito -> incidentesPorDelitoChart
    try {
        const { txt } = await fetchCsvWithFallback(makePaths(files.delitos));
        const data = parseCsvText(txt);
        const labels = data.map(r => r.preso_delito || r.delito);
        const values = data.map(r => r.total_incidentes || r.total || 0);
        const ctx = safeEl('incidentesPorDelitoChart');
        if (ctx) {
            if (window._chart_incidentesPorDelito) window._chart_incidentesPorDelito.destroy();
            window._chart_incidentesPorDelito = new Chart(ctx, { type: 'bar', data: { labels: labels.slice(0, topN), datasets: [{ label: 'Incidentes por delito', data: values.slice(0, topN), backgroundColor: '#3b82f6' }] }, options: { responsive: true } });
        }
    } catch (e) { console.warn('delitos CSV not loaded:', e.message); }

    return metrics;
}

function updateKPIs(metrics) {
    try {
        if (metrics.totalPresos !== undefined) {
            const el = document.getElementById('totalPresos'); if (el) el.textContent = metrics.totalPresos;
        }
        if (metrics.totalGuardias !== undefined) {
            const el = document.getElementById('totalGuardias'); if (el) el.textContent = metrics.totalGuardias;
        }
        if (metrics.totalIncidentes !== undefined) {
            const el = document.getElementById('totalIncidentes'); if (el) el.textContent = metrics.totalIncidentes;
        }
        if (metrics.totalVisitas !== undefined) {
            const el = document.getElementById('totalVisitas'); if (el) el.textContent = metrics.totalVisitas;
        }
    } catch (e) { console.warn('updateKPIs error', e); }
}

export async function buildUIControls() {
    // attach controls if present
    const refreshBtn = safeEl('csvRefreshBtn');
    const downloadBtn = safeEl('downloadMetricsBtn');
    const exportBtn = safeEl('exportChartsBtn');
    const topNInput = safeEl('topNInput');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const topN = topNInput ? Number(topNInput.value) || 10 : 10;
            const status = safeEl('dashboardStatus'); if (status) status.textContent = 'Refrescando desde CSV...';
            try {
                const metrics = await loadAndRenderAllFromCSVs({ topN });
                updateKPIs(metrics);
                if (status) status.textContent = 'Datos actualizados desde CSV';
            } catch (e) {
                console.error(e);
                if (status) status.textContent = 'Error cargando CSVs';
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const topN = topNInput ? Number(topNInput.value) || 10 : 10;
            const metrics = await loadAndRenderAllFromCSVs({ topN });
            downloadMetricsCSV(metrics);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportAllCharts();
        });
    }
}

export function downloadMetricsCSV(metrics) {
    const rows = [['metric,value'], ['totalPresos,' + (metrics.totalPresos || 0)], ['totalGuardias,' + (metrics.totalGuardias || 0)], ['totalIncidentes,' + (metrics.totalIncidentes || 0)], ['totalVisitas,' + (metrics.totalVisitas || 0)]];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lapicota_metrics.csv'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}

export function exportAllCharts() {
    const keys = Object.keys(window).filter(k => k.startsWith('_chart_'));
    keys.forEach(k => {
        const chart = window[k];
        try {
            const url = chart.toBase64Image();
            const a = document.createElement('a');
            a.href = url; a.download = `${k}.png`; document.body.appendChild(a); a.click(); a.remove();
        } catch (e) {
            console.warn('No se pudo exportar', k, e);
        }
    });
}

export default { loadAndRenderAllFromCSVs, buildUIControls, downloadMetricsCSV, exportAllCharts };