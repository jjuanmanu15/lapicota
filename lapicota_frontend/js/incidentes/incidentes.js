import { API_INCIDENTES, API_USUARIOS } from "../api.js";
let modal;
let modalDetalles;
let incidentesOriginal = []; // Guardar todos los incidentes para filtrar
let presosMap = {}; // Map para búsqueda rápida de presos

document.addEventListener("DOMContentLoaded", () => {
    modal = new bootstrap.Modal(document.getElementById('modalIncidente'));
    modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
    cargarIncidentes();
    cargarSelects();
    aplicarTemaActual();

    // Listener para cambios de tema
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
});

// ============================================
// CARGAR INCIDENTES
// ============================================
async function cargarIncidentes() {
    try {
        const res = await fetch(API_INCIDENTES);
        const data = await res.json();

        incidentesOriginal = data;
        renderizarTabla(data);
        actualizarEstadisticas(data);
    } catch (error) {
        console.error("Error cargando incidentes:", error);
        mostrarAlerta("Error al cargar incidentes", "danger");
    }
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderizarTabla(incidentes) {
    const tabla = document.getElementById("tablaIncidentes");

    if (incidentes.length === 0) {
        tabla.innerHTML = `<tr><td colspan="8" class="text-muted py-4">No hay incidentes que coincidan con los filtros</td></tr>`;
        document.getElementById("totalRegistros").textContent = "0 incidentes";
        return;
    }

    tabla.innerHTML = incidentes.map(i => {
        const preso = i.preso
            ? `${i.preso.nombres} ${i.preso.apellidos}<br><small class="text-muted">${i.preso.numero_documento || 'N/A'}</small>`
            : "—";

        const guardia = i.guardia
            ? `${i.guardia.nombres} ${i.guardia.apellidos}<br><small class="text-muted">${i.guardia.rango}</small>`
            : "—";

        const fechaFormato = i.fecha_incidente
            ? new Date(i.fecha_incidente).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
            : "—";

        return `
            <tr>
                <td><strong>#${i.id_incidente}</strong></td>
                <td>
                    <div>${fechaFormato}</div>
                    <small class="text-muted">${i.hora_incidente || "N/A"}</small>
                </td>
                <td><span class="badge bg-danger">${i.tipo_incidente}</span></td>
                <td class="text-start">
                    ${preso}
                </td>
                <td class="text-start">
                    ${guardia}
                </td>
                <td class="text-start">
                    <small>${i.descripcion?.substring(0, 40) || '—'}${i.descripcion?.length > 40 ? '...' : ''}</small>
                </td>
                <td>
                    <span class="badge ${colorEstado(i.estado_incidente)}">
                        ${i.estado_incidente}
                    </span>
                </td>
                <td>
                    <div class="btn-group gap-2" role="group">
                        <button class="btn btn-sm btn-info" title="Ver detalles" onclick="verDetalles(${i.id_incidente})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-warning crud-button" title="Editar" onclick="editar(${i.id_incidente})">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById("totalRegistros").textContent = `${incidentes.length} incidente(s)`;
}

// ============================================
// VER DETALLES COMPLETOS
// ============================================
async function verDetalles(id) {
    const incidente = incidentesOriginal.find(i => i.id_incidente === id);
    if (!incidente) return;

    const html = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6 class="text-muted">ID del Incidente</h6>
                <p class="fw-bold">${incidente.id_incidente}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Tipo</h6>
                <p class="fw-bold"><span class="badge bg-danger">${incidente.tipo_incidente}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Fecha del Incidente</h6>
                <p class="fw-bold">${new Date(incidente.fecha_incidente).toLocaleDateString('es-ES')}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Hora</h6>
                <p class="fw-bold">${incidente.hora_incidente || 'N/A'}</p>
            </div>
            <div class="col-12">
                <h6 class="text-muted">Estado</h6>
                <p class="fw-bold"><span class="badge ${colorEstado(incidente.estado_incidente)} fs-6">${incidente.estado_incidente}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Preso</h6>
                ${incidente.preso ? `
                    <p class="fw-bold">${incidente.preso.nombres} ${incidente.preso.apellidos}</p>
                    <small class="text-muted">
                        Cédula: ${incidente.preso.numero_documento || 'N/A'}<br>
                        Celda: ${incidente.preso.celda || 'N/A'}<br>
                        Patio: ${incidente.preso.patio || 'N/A'}
                    </small>
                ` : '<p class="text-muted">—</p>'}
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Guardia que Reporta</h6>
                ${incidente.guardia ? `
                    <p class="fw-bold">${incidente.guardia.nombres} ${incidente.guardia.apellidos}</p>
                    <small class="text-muted">
                        Rango: ${incidente.guardia.rango || 'N/A'}<br>
                        Turno: ${incidente.guardia.turno || 'N/A'}
                    </small>
                ` : '<p class="text-muted">—</p>'}
            </div>
            <div class="col-12">
                <h6 class="text-muted">Descripción Completa</h6>
                <p class="text-justify">${incidente.descripcion || 'Sin descripción'}</p>
            </div>
        </div>
    `;

    document.getElementById("modalDetallesContenido").innerHTML = html;
    modalDetalles.show();
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function actualizarEstadisticas(incidentes) {
    const total = incidentes.length;
    const pendientes = incidentes.filter(i => i.estado_incidente === 'PENDIENTE').length;
    const proceso = incidentes.filter(i => i.estado_incidente === 'EN_PROCESO').length;
    const resueltos = incidentes.filter(i => i.estado_incidente === 'RESUELTO').length;

    document.getElementById('totalIncidentes').textContent = total;
    document.getElementById('estatusPendientes').textContent = pendientes;
    document.getElementById('estatusProceso').textContent = proceso;
    document.getElementById('estatusResueltos').textContent = resueltos;
}

// ============================================
// FILTRAR INCIDENTES
// ============================================
function filtrarIncidentes() {
    const cedulaFiltro = document.getElementById('filtroCedula').value.toLowerCase().trim();
    const tipoFiltro = document.getElementById('filtroTipo').value;
    const estadoFiltro = document.getElementById('filtroEstado').value;
    const fechaInicio = document.getElementById('filtroFechaInicio').value;
    const fechaFin = document.getElementById('filtroFechaFin').value;
    const descripcionFiltro = document.getElementById('buscador').value.toLowerCase().trim();

    let filtered = incidentesOriginal.filter(incidente => {
        // Filtro por cédula del preso (búsqueda en cédula o nombres)
        if (cedulaFiltro) {
            const cedula = incidente.preso?.cedula?.toLowerCase() || '';
            const nombres = `${incidente.preso?.nombres} ${incidente.preso?.apellidos}`.toLowerCase() || '';

            if (!cedula.includes(cedulaFiltro) && !nombres.includes(cedulaFiltro)) {
                return false;
            }
        }

        // Filtro por tipo
        if (tipoFiltro && incidente.tipo_incidente !== tipoFiltro) {
            return false;
        }

        // Filtro por estado
        if (estadoFiltro && incidente.estado_incidente !== estadoFiltro) {
            return false;
        }

        // Filtro por rango de fechas
        if (fechaInicio || fechaFin) {
            const fechaIncidente = new Date(incidente.fecha_incidente).toISOString().split('T')[0];

            if (fechaInicio && fechaIncidente < fechaInicio) {
                return false;
            }
            if (fechaFin && fechaIncidente > fechaFin) {
                return false;
            }
        }

        // Filtro por descripción
        if (descripcionFiltro) {
            const descripcion = incidente.descripcion?.toLowerCase() || '';
            const tipo = incidente.tipo_incidente?.toLowerCase() || '';

            if (!descripcion.includes(descripcionFiltro) && !tipo.includes(descripcionFiltro)) {
                return false;
            }
        }

        return true;
    });

    renderizarTabla(filtered);
    actualizarEstadisticas(filtered);
}

// ============================================
// LIMPIAR FILTROS
// ============================================
function limpiarFiltros() {
    document.getElementById('filtroCedula').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroFechaInicio').value = '';
    document.getElementById('filtroFechaFin').value = '';
    document.getElementById('buscador').value = '';

    renderizarTabla(incidentesOriginal);
    actualizarEstadisticas(incidentesOriginal);
}

// ============================================
// MODAL Y FORMULARIO
// ============================================
function abrirModal() {
    limpiarFormulario();
    modal.show();
}

async function editar(id) {
    const res = await fetch(`${API_INCIDENTES}/${id}`);
    const i = await res.json();

    document.getElementById("id_incidente").value = i.id_incidente;
    document.getElementById("tipo").value = i.tipo_incidente;
    document.getElementById("descripcion").value = i.descripcion;
    document.getElementById("fecha").value = i.fecha_incidente.split("T")[0];
    document.getElementById("hora").value = i.hora_incidente;
    document.getElementById("preso").value = i.preso?.id_preso || "";
    document.getElementById("guardia").value = i.guardia?.id_guardia || "";
    document.getElementById("estado").value = i.estado_incidente;

    modal.show();
}

// ============================================
// VALIDACIÓN Y GUARDADO
// ============================================
function validarIncidenteForm() {
    const tipo = document.getElementById("tipo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const preso = document.getElementById("preso").value;
    const guardia = document.getElementById("guardia").value;

    const errores = [];

    if (!tipo) errores.push("El tipo de incidente es obligatorio.");
    if (!descripcion) errores.push("La descripción es obligatoria.");
    if (!fecha) errores.push("La fecha del incidente es obligatoria.");
    if (!hora) errores.push("La hora del incidente es obligatoria.");
    if (!preso) errores.push("Debe seleccionar un preso.");
    if (!guardia) errores.push("Debe seleccionar un guardia.");

    // Validación de fecha no mayor a hoy
    const hoy = new Date().toISOString().split('T')[0];
    if (fecha > hoy) {
        errores.push("La fecha del incidente no puede ser futura.");
    }

    // Validación de hora si la fecha es hoy
    if (fecha === hoy) {
        const ahora = new Date();
        const horaActual = ahora.getHours().toString().padStart(2, '0') + ':' + ahora.getMinutes().toString().padStart(2, '0');
        if (hora > horaActual) {
            errores.push("La hora del incidente no puede ser futura si la fecha es hoy.");
        }
    }

    return errores;
}

async function guardarIncidente() {
    const errores = validarIncidenteForm();
    if (errores.length > 0) {
        mostrarAlerta(errores.join(" | "), "warning");
        return;
    }

    const id = document.getElementById("id_incidente").value;

    const incidente = {
        tipo_incidente: document.getElementById("tipo").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        fecha_incidente: document.getElementById("fecha").value,
        hora_incidente: document.getElementById("hora").value,
        preso_id: parseInt(document.getElementById("preso").value, 10),
        guardia_id: parseInt(document.getElementById("guardia").value, 10),
        estado_incidente: document.getElementById("estado").value
    };

    try {
        const url = id ? `${API_INCIDENTES}/${id}` : API_INCIDENTES;
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(incidente)
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = data.error || data.message || `Error ${response.status}: ${response.statusText}`;
            mostrarAlerta(message, "danger");
            return;
        }

        mostrarAlerta(id ? "Incidente actualizado con éxito." : "Incidente creado con éxito.", "success");
        modal.hide();
        limpiarFormulario();
        await cargarIncidentes();
    } catch (error) {
        console.error(error);
        mostrarAlerta(error.message || "Error al guardar el incidente.", "danger");
    }
}

function limpiarFormulario() {
    document.getElementById("id_incidente").value = "";
    document.getElementById("tipo").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("hora").value = "";
    document.getElementById("estado").value = "PENDIENTE";

    $("#preso").val(null).trigger("change");
    $("#guardia").val(null).trigger("change");
}

// ============================================
// UTILIDADES
// ============================================
function colorEstado(estado) {
    const colores = {
        "PENDIENTE": "bg-secondary",
        "EN_PROCESO": "bg-warning",
        "RESUELTO": "bg-success",
        "CANCELADO": "bg-danger"
    };
    return colores[estado] || "bg-dark";
}

function mostrarAlerta(mensaje, tipo = "danger") {
    const container = document.getElementById("alertContainer");

    container.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = "";
    }, 4000);
}

async function cargarSelects() {
    try {
        const [presos, guardias] = await Promise.all([
            fetch(`${API_USUARIOS}/presos`).then(r => r.json()),
            fetch(`${API_USUARIOS}/guardias`).then(r => r.json())
        ]);

        // Guardar mapa de presos para búsqueda rápida
        presos.forEach(p => {
            presosMap[p.id_preso] = {
                cedula: p.cedula,
                nombres: p.nombres,
                apellidos: p.apellidos
            };
        });

        const selectPreso = $("#preso");
        const selectGuardia = $("#guardia");

        selectPreso.empty();
        selectGuardia.empty();

        presos.forEach(p => {
            selectPreso.append(new Option(
                `${p.nombres} ${p.apellidos} | Celda ${p.celda} | Cédula: ${p.cedula || 'N/A'}`,
                p.id_preso
            ));
        });

        guardias.forEach(g => {
            selectGuardia.append(new Option(
                `${g.nombres} ${g.apellidos} | ${g.rango} | ${g.turno}`,
                g.id_guardia
            ));
        });

        // Activar Select2
        selectPreso.select2({
            dropdownParent: $('#modalIncidente'),
            placeholder: "Buscar preso...",
            width: '100%'
        });

        selectGuardia.select2({
            dropdownParent: $('#modalIncidente'),
            placeholder: "Buscar guardia...",
            width: '100%'
        });

    } catch (error) {
        console.error("Error cargando selects:", error);
        mostrarAlerta("Error cargando presos y guardias", "danger");
    }
}

// ============================================
// TEMA (LIGHT/DARK)
// ============================================
function aplicarTemaActual() {
    applyTheme(getCurrentTheme());
}

function getCurrentTheme() {
    return localStorage.getItem('lapicotaTheme') || 'light';
}

function applyTheme(mode) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${mode}-mode`);
    localStorage.setItem('lapicotaTheme', mode);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = mode === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    }
}

function toggleTheme() {
    const current = getCurrentTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Exponer funciones para enlazar con onclick en HTML (scope global en módulos)
window.abrirModal = abrirModal;
window.verDetalles = verDetalles;
window.editar = editar;
window.filtrarIncidentes = filtrarIncidentes;
window.limpiarFiltros = limpiarFiltros;
window.guardarIncidente = guardarIncidente;