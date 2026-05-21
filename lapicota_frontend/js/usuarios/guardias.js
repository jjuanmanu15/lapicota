import { API_USUARIOS } from "../api.js";
const API_GUARDIAS = `${API_USUARIOS}/guardias`;
let modal;
let modalDetalles;
let guardiasOriginal = []; // Guardar todos los guardias para filtrar

document.addEventListener("DOMContentLoaded", () => {
    modal = new bootstrap.Modal(document.getElementById('modalGuardia'));
    modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
    cargarGuardias();
    aplicarTemaActual();

    // Listener para cambios de tema
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
});

// ============================================
// CARGAR GUARDIAS
// ============================================
async function cargarGuardias() {
    try {
        const res = await fetch(API_GUARDIAS);
        const data = await res.json();

        guardiasOriginal = data;
        renderizarTabla(data);
        actualizarEstadisticas(data);
    } catch (error) {
        console.error("Error cargando guardias:", error);
        mostrarAlerta("Error al cargar guardias", "danger");
    }
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderizarTabla(guardias) {
    const tabla = document.getElementById("tablaGuardias");

    if (guardias.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" class="text-muted py-4">No hay guardias que coincidan con los filtros</td></tr>`;
        document.getElementById("totalRegistros").textContent = "0 guardias";
        return;
    }

    tabla.innerHTML = guardias.map(g => {
        const nombreCompleto = `${g.nombres} ${g.apellidos}`;

        return `
            <tr>
                <td><strong>#${g.id_guardia}</strong></td>
                <td class="text-start">
                    <div>${nombreCompleto}</div>
                    <small class="text-muted">${g.fecha_nacimiento ? new Date(g.fecha_nacimiento).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) : 'N/A'}</small>
                </td>
                <td>${g.numero_documento}</td>
                <td><span class="badge bg-primary">${g.rango}</span></td>
                <td><span class="badge bg-secondary">${g.turno}</span></td>
                <td>
                    <span class="badge ${colorEstado(g.estado)}">
                        ${g.estado}
                    </span>
                </td>
                <td>
                    <div class="btn-group gap-2" role="group">
                        <button class="btn btn-sm btn-info" title="Ver detalles" onclick="verDetalles(${g.id_guardia})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-warning crud-button" title="Editar" onclick="editar(${g.id_guardia})">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById("totalRegistros").textContent = `${guardias.length} guardia(s)`;
}

// ============================================
// VER DETALLES COMPLETOS
// ============================================
async function verDetalles(id) {
    const guardia = guardiasOriginal.find(g => g.id_guardia === id);
    if (!guardia) return;

    const html = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6 class="text-muted">ID del Guardia</h6>
                <p class="fw-bold">${guardia.id_guardia}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Número de Documento</h6>
                <p class="fw-bold">${guardia.numero_documento}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Nombres</h6>
                <p class="fw-bold">${guardia.nombres}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Apellidos</h6>
                <p class="fw-bold">${guardia.apellidos}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Fecha de Nacimiento</h6>
                <p class="fw-bold">${guardia.fecha_nacimiento ? new Date(guardia.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Rango</h6>
                <p class="fw-bold"><span class="badge bg-primary">${guardia.rango}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Turno</h6>
                <p class="fw-bold"><span class="badge bg-secondary">${guardia.turno}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Estado</h6>
                <p class="fw-bold"><span class="badge ${colorEstado(guardia.estado)} fs-6">${guardia.estado}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Patio Asignado</h6>
                <p class="fw-bold">${guardia.patio_asignado || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Zona Asignada</h6>
                <p class="fw-bold">${guardia.zona_asignada || 'N/A'}</p>
            </div>
        </div>
    `;

    document.getElementById("modalDetallesContenido").innerHTML = html;
    modalDetalles.show();
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function actualizarEstadisticas(guardias) {
    const total = guardias.length;
    const activos = guardias.filter(g => g.estado === 'ACTIVO').length;
    const inactivos = guardias.filter(g => g.estado === 'INACTIVO').length;
    const trasladados = guardias.filter(g => g.estado === 'TRASLADADO').length;

    document.getElementById('totalGuardias').textContent = total;
    document.getElementById('estatusActivos').textContent = activos;
    document.getElementById('estatusInactivos').textContent = inactivos;
    document.getElementById('estatusTrasladados').textContent = trasladados;
}

// ============================================
// FILTRAR GUARDIAS
// ============================================
function filtrarGuardias() {
    const documentoFiltro = document.getElementById('filtroDocumento').value.toLowerCase().trim();
    const rangoFiltro = document.getElementById('filtroRango').value;
    const turnoFiltro = document.getElementById('filtroTurno').value;
    const estadoFiltro = document.getElementById('filtroEstado').value;

    let filtered = guardiasOriginal.filter(guardia => {
        // Filtro por documento o nombre
        if (documentoFiltro) {
            const documento = guardia.numero_documento?.toLowerCase() || '';
            const nombres = `${guardia.nombres} ${guardia.apellidos}`.toLowerCase() || '';

            if (!documento.includes(documentoFiltro) && !nombres.includes(documentoFiltro)) {
                return false;
            }
        }

        // Filtro por rango
        if (rangoFiltro && guardia.rango !== rangoFiltro) {
            return false;
        }

        // Filtro por turno
        if (turnoFiltro && guardia.turno !== turnoFiltro) {
            return false;
        }

        // Filtro por estado
        if (estadoFiltro && guardia.estado !== estadoFiltro) {
            return false;
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
    document.getElementById('filtroDocumento').value = '';
    document.getElementById('filtroRango').value = '';
    document.getElementById('filtroTurno').value = '';
    document.getElementById('filtroEstado').value = '';

    renderizarTabla(guardiasOriginal);
    actualizarEstadisticas(guardiasOriginal);
}

// ============================================
// MODAL Y FORMULARIO
// ============================================
function abrirModal() {
    limpiarFormulario();
    modal.show();
}

async function editar(id) {
    const res = await fetch(`${API_GUARDIAS}/${id}`);
    const g = await res.json();

    document.getElementById("id_guardia").value = g.id_guardia;
    document.getElementById("numero_documento").value = g.numero_documento;
    document.getElementById("nombres").value = g.nombres;
    document.getElementById("apellidos").value = g.apellidos;
    document.getElementById("fecha_nacimiento").value = g.fecha_nacimiento ? g.fecha_nacimiento.split("T")[0] : "";
    document.getElementById("rango").value = g.rango;
    document.getElementById("turno").value = g.turno;
    document.getElementById("estado").value = g.estado;

    modal.show();
}

// ============================================
// VALIDACIÓN Y GUARDADO
// ============================================
function validarGuardiaForm() {
    const numero_documento = document.getElementById("numero_documento").value.trim();
    const nombres = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const fecha_nacimiento = document.getElementById("fecha_nacimiento").value;

    const errores = [];

    if (!numero_documento) errores.push("El número de documento es obligatorio.");
    if (!/^\d+$/.test(numero_documento)) errores.push("El número de documento debe contener solo números.");
    if (!nombres) errores.push("Los nombres son obligatorios.");
    if (!apellidos) errores.push("Los apellidos son obligatorios.");
    if (!fecha_nacimiento) errores.push("La fecha de nacimiento es obligatoria.");

    // Validación de fecha no futura
    const hoy = new Date().toISOString().split('T')[0];
    if (fecha_nacimiento > hoy) {
        errores.push("La fecha de nacimiento no puede ser futura.");
    }

    return errores;
}

async function guardarGuardia() {
    const errores = validarGuardiaForm();
    if (errores.length > 0) {
        mostrarAlerta(errores.join(" | "), "warning");
        return;
    }

    const id = document.getElementById("id_guardia").value;

    const guardia = {
        numero_documento: document.getElementById("numero_documento").value.trim(),
        nombres: document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        fecha_nacimiento: document.getElementById("fecha_nacimiento").value,
        rango: document.getElementById("rango").value,
        turno: document.getElementById("turno").value,
        patio_asignado: "Patio A", // Valor por defecto
        zona_asignada: "Zona Norte", // Valor por defecto
        estado: document.getElementById("estado").value
    };

    try {
        const url = id ? `${API_GUARDIAS}/${id}` : API_GUARDIAS;
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(guardia)
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = data.error || data.message || `Error ${response.status}: ${response.statusText}`;
            mostrarAlerta(message, "danger");
            return;
        }

        mostrarAlerta(id ? "Guardia actualizado con éxito." : "Guardia creado con éxito.", "success");
        modal.hide();
        limpiarFormulario();
        await cargarGuardias();
    } catch (error) {
        console.error(error);
        mostrarAlerta(error.message || "Error al guardar el guardia.", "danger");
    }
}

function limpiarFormulario() {
    document.getElementById("id_guardia").value = "";
    document.getElementById("numero_documento").value = "";
    document.getElementById("nombres").value = "";
    document.getElementById("apellidos").value = "";
    document.getElementById("fecha_nacimiento").value = "";
    document.getElementById("rango").value = "OFICIAL";
    document.getElementById("turno").value = "MAÑANA";
    document.getElementById("estado").value = "ACTIVO";
}

// ============================================
// UTILIDADES
// ============================================
function colorEstado(estado) {
    const colores = {
        "ACTIVO": "bg-success",
        "INACTIVO": "bg-secondary",
        "TRASLADADO": "bg-info"
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
    }, 5000);
}

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
window.filtrarGuardias = filtrarGuardias;
window.limpiarFiltros = limpiarFiltros;
window.guardarGuardia = guardarGuardia;