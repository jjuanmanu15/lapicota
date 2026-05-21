import { API_VISITAS, API_USUARIOS } from "../api.js";
let modal;
let modalDetalles;
let visitasOriginal = []; // Guardar todas las visitas para filtrar
let presosMap = {}; // Mapa id -> nombre para mostrar y selección

document.addEventListener("DOMContentLoaded", () => {
    modal = new bootstrap.Modal(document.getElementById('modalVisita'));
    modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
    cargarPresos();
    cargarVisitas();
    aplicarTemaActual();

    // Listener para cambios de tema
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
});

// ============================================
// CARGAR PRESOS
// ============================================
async function cargarPresos() {
    try {
        const res = await fetch(`${API_USUARIOS}/presos`);
        const data = await res.json();

        presosMap = data.reduce((acc, preso) => {
            acc[preso.id_preso] = {
                nombre: `${preso.nombres} ${preso.apellidos}`,
                estado: preso.estado || 'ACTIVO'
            };
            return acc;
        }, {});

        const selectPreso = document.getElementById("preso_id");
        if (!selectPreso) return;

        selectPreso.innerHTML = `<option value="">Selecciona un preso...</option>`;
        data.forEach(preso => {
            const nombre = `${preso.nombres} ${preso.apellidos}`;
            selectPreso.innerHTML += `<option value="${preso.id_preso}">${nombre} (ID ${preso.id_preso})</option>`;
        });
    } catch (error) {
        console.error("Error cargando presos:", error);
        mostrarAlerta("No se pudo cargar la lista de presos", "warning");
    }
}

// ============================================
// CARGAR VISITAS
// ============================================
async function cargarVisitas() {
    try {
        const res = await fetch(API_VISITAS);
        const data = await res.json();

        visitasOriginal = data;
        renderizarTabla(data);
        actualizarEstadisticas(data);
    } catch (error) {
        console.error("Error cargando visitas:", error);
        mostrarAlerta("Error al cargar visitas", "danger");
    }
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderizarTabla(visitas) {
    const tabla = document.getElementById("tablaVisitas");

    if (visitas.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" class="text-muted py-4">No hay visitas que coincidan con los filtros</td></tr>`;
        document.getElementById("totalRegistros").textContent = "0 visitas";
        return;
    }

    tabla.innerHTML = visitas.map(v => {
        const fechaFormato = v.fecha_visita
            ? new Date(v.fecha_visita).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
            : "—";

        return `
            <tr>
                <td><strong>#${v.id_visita}</strong></td>
                <td class="text-start">
                    <div class="fw-bold">${v.nombre_visitante || '—'}</div>
                    <small class="text-muted">Doc: ${v.documento_visitante || 'N/A'}</small>
                </td>
                <td>${v.documento_visitante || '—'}</td>
                <td>
                    <strong>${v.preso_id || '—'}</strong><br>
                    <small class="text-muted">${(presosMap[v.preso_id]?.nombre) || 'Preso no disponible'} (${(presosMap[v.preso_id]?.estado) || 'SIN ESTADO'})</small>
                </td>
                <td>
                    <div>${fechaFormato}</div>
                    <small class="text-muted">${v.hora_visita || "N/A"}</small>
                </td>
                <td>
                    <span class="badge ${colorEstado(v.estado_visita)}">
                        ${v.estado_visita || 'SIN ESTADO'}
                    </span>
                </td>
                <td>
                    <div class="btn-group gap-2" role="group">
                        <button class="btn btn-sm btn-info" title="Ver detalles" onclick="verDetalles(${v.id_visita})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-warning crud-button" title="Editar" onclick="editar(${v.id_visita})">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById("totalRegistros").textContent = `${visitas.length} visita(s)`;
}

// ============================================
// VER DETALLES COMPLETOS
// ============================================
async function verDetalles(id) {
    const visita = visitasOriginal.find(v => v.id_visita === id);
    if (!visita) return;

    const fechaFormato = visita.fecha_visita
        ? new Date(visita.fecha_visita).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'No especificada';

    const html = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6 class="text-muted">ID de la Visita</h6>
                <p class="fw-bold">#${visita.id_visita}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Estado</h6>
                <p class="fw-bold"><span class="badge ${colorEstado(visita.estado_visita)} fs-6">${visita.estado_visita || 'SIN ESTADO'}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Nombre del Visitante</h6>
                <p class="fw-bold">${visita.nombre_visitante || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Documento del Visitante</h6>
                <p class="fw-bold">${visita.documento_visitante || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">ID del Preso</h6>
                <p class="fw-bold">${visita.preso_id || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Fecha de Visita</h6>
                <p class="fw-bold">${fechaFormato}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Hora de Visita</h6>
                <p class="fw-bold">${visita.hora_visita || 'No especificada'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Motivo de Denegación</h6>
                <p class="fw-bold">${visita.motivo_denegacion || 'Sin motivo'}</p>
            </div>
        </div>
    `;

    document.getElementById("modalDetallesContenido").innerHTML = html;
    modalDetalles.show();
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function actualizarEstadisticas(visitas) {
    const total = visitas.length;
    const pendientes = visitas.filter(v => v.estado_visita === 'PENDIENTE').length;
    const aprobadas = visitas.filter(v => v.estado_visita === 'APROBADA').length;
    const finalizadas = visitas.filter(v => v.estado_visita === 'FINALIZADA').length;

    document.getElementById('totalVisitas').textContent = total;
    document.getElementById('estatusPendientes').textContent = pendientes;
    document.getElementById('estatusAprobadas').textContent = aprobadas;
    document.getElementById('estatusFinalizadas').textContent = finalizadas;
}

// ============================================
// FILTRAR VISITAS
// ============================================
function filtrarVisitas() {
    const nombreFiltro = document.getElementById('filtroNombre').value.toLowerCase().trim();
    const documentoFiltro = document.getElementById('filtroDocumento').value.toLowerCase().trim();
    const estadoFiltro = document.getElementById('filtroEstado').value;
    const fechaFiltro = document.getElementById('filtroFecha').value;
    const presoIdFiltro = document.getElementById('filtroPresoId').value.trim();

    let filtered = visitasOriginal.filter(visita => {
        // Filtro por nombre del visitante
        if (nombreFiltro) {
            const nombre = visita.nombre_visitante?.toLowerCase() || '';
            if (!nombre.includes(nombreFiltro)) {
                return false;
            }
        }

        // Filtro por documento del visitante
        if (documentoFiltro) {
            const documento = visita.documento_visitante?.toLowerCase() || '';
            if (!documento.includes(documentoFiltro)) {
                return false;
            }
        }

        // Filtro por estado
        if (estadoFiltro && visita.estado_visita !== estadoFiltro) {
            return false;
        }

        // Filtro por fecha
        if (fechaFiltro) {
            const fechaVisita = visita.fecha_visita ? visita.fecha_visita.split('T')[0] : '';
            if (fechaVisita !== fechaFiltro) {
                return false;
            }
        }

        // Filtro por ID del preso
        if (presoIdFiltro) {
            const presoId = visita.preso_id?.toString() || '';
            if (!presoId.includes(presoIdFiltro)) {
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
    document.getElementById('filtroNombre').value = '';
    document.getElementById('filtroDocumento').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroPresoId').value = '';

    renderizarTabla(visitasOriginal);
    actualizarEstadisticas(visitasOriginal);
}

// ============================================
// MODAL Y FORMULARIO
// ============================================
function abrirModal() {
    limpiarFormulario();
    modal.show();
}

async function editar(id) {
    const res = await fetch(`${API_VISITAS}/${id}`);
    const v = await res.json();

    document.getElementById("id_visita").value = v.id_visita;
    document.getElementById("nombre_visitante").value = v.nombre_visitante || '';
    document.getElementById("documento_visitante").value = v.documento_visitante || '';
    document.getElementById("preso_id").value = v.preso_id || '';
    document.getElementById("fecha_visita").value = v.fecha_visita ? v.fecha_visita.split("T")[0] : '';
    document.getElementById("hora_visita").value = v.hora_visita || '';
    document.getElementById("estado_visita").value = v.estado_visita || 'PENDIENTE';
    document.getElementById("motivo_denegacion").value = v.motivo_denegacion || '';

    modal.show();
}

// ============================================
// VALIDACIÓN Y GUARDADO
// ============================================
function validarVisitaForm() {
    const nombre = document.getElementById("nombre_visitante").value.trim();
    const documento = document.getElementById("documento_visitante").value.trim();
    const presoId = document.getElementById("preso_id").value.trim();
    const fecha = document.getElementById("fecha_visita").value;
    const hora = document.getElementById("hora_visita").value;
    const estado = document.getElementById("estado_visita").value;
    const motivo = document.getElementById("motivo_denegacion").value.trim();

    const errores = [];

    if (!nombre) errores.push("El nombre del visitante es obligatorio.");
    if (!documento) errores.push("El documento del visitante es obligatorio.");
    if (!presoId) errores.push("El ID del preso es obligatorio.");
    if (!fecha) errores.push("La fecha de visita es obligatoria.");
    if (!hora) errores.push("La hora de visita es obligatoria.");

    // Validación de nombre
    if (nombre.length < 3 || nombre.length > 150) {
        errores.push("El nombre del visitante debe tener entre 3 y 150 caracteres.");
    }

    // Validación de documento
    if (!/^\d{5,30}$/.test(documento)) {
        errores.push("El documento debe contener solo dígitos y tener entre 5 y 30 caracteres.");
    }

    // Validación de preso_id
    const presoIdNum = parseInt(presoId, 10);
    if (isNaN(presoIdNum) || presoIdNum <= 0) {
        errores.push("El ID del preso debe ser un número entero positivo.");
    } else {
        const presoSeleccionado = presosMap[presoIdNum];
        if (!presoSeleccionado) {
            errores.push("El preso seleccionado no existe.");
        } else if (presoSeleccionado.estado !== 'ACTIVO') {
            errores.push(`El preso está en estado '${presoSeleccionado.estado}' y no puede recibir visitas.`);
        }
    }

    // Validación de motivo para estados específicos
    if ((estado === "RECHAZADA" || estado === "DENEGADA") && !motivo) {
        errores.push("Debe especificar un motivo de denegación para el estado seleccionado.");
    }

    // Validación de fecha no futura
    const hoy = new Date().toISOString().split('T')[0];
    if (fecha > hoy) {
        errores.push("La fecha de visita no puede ser futura.");
    }

    return errores;
}

async function guardarVisita() {
    const errores = validarVisitaForm();
    if (errores.length > 0) {
        mostrarAlerta(errores.join(" | "), "warning");
        return;
    }

    const id = document.getElementById("id_visita").value;

    const visita = {
        nombre_visitante: document.getElementById("nombre_visitante").value.trim(),
        documento_visitante: document.getElementById("documento_visitante").value.trim(),
        preso_id: parseInt(document.getElementById("preso_id").value, 10),
        fecha_visita: document.getElementById("fecha_visita").value,
        hora_visita: document.getElementById("hora_visita").value,
        estado_visita: document.getElementById("estado_visita").value,
        motivo_denegacion: document.getElementById("motivo_denegacion").value.trim() || null
    };

    try {
        const url = id ? `${API_VISITAS}/${id}` : API_VISITAS;
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visita)
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = data.error || data.message || `Error ${response.status}: ${response.statusText}`;
            mostrarAlerta(message, "danger");
            return;
        }

        mostrarAlerta(id ? "Visita actualizada con éxito." : "Visita creada con éxito.", "success");
        modal.hide();
        limpiarFormulario();
        await cargarVisitas();
    } catch (error) {
        console.error(error);
        mostrarAlerta(error.message || "Error al guardar la visita.", "danger");
    }
}

function limpiarFormulario() {
    document.getElementById("id_visita").value = "";
    document.getElementById("nombre_visitante").value = "";
    document.getElementById("documento_visitante").value = "";
    document.getElementById("preso_id").value = "";
    document.getElementById("fecha_visita").value = "";
    document.getElementById("hora_visita").value = "";
    document.getElementById("estado_visita").value = "PENDIENTE";
    document.getElementById("motivo_denegacion").value = "";
}

// ============================================
// UTILIDADES
// ============================================
function colorEstado(estado) {
    const colores = {
        "PENDIENTE": "bg-secondary",
        "APROBADA": "bg-primary",
        "RECHAZADA": "bg-danger",
        "PERMITIDA": "bg-success",
        "DENEGADA": "bg-danger",
        "FINALIZADA": "bg-dark",
        "CANCELADA": "bg-warning"
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
window.filtrarVisitas = filtrarVisitas;
window.limpiarFiltros = limpiarFiltros;
window.guardarVisita = guardarVisita;