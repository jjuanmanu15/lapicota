import { API_USUARIOS } from "../api.js";
const API_PRESOS = `${API_USUARIOS}/presos`;
let modalPreso;
let modalDetalles;
let presosOriginal = [];

function mostrarAlertaPresos(mensaje, tipo = "success") {
    const container = document.getElementById("alertContainer");
    if (!container) {
        console.warn("alertContainer no encontrado, usando alert global");
        alert(mensaje);
        return;
    }

    container.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    `;
    setTimeout(() => (container.innerHTML = ""), 5000);
}

function validarFormularioPreso() {
    const doc = document.getElementById("doc").value.trim();
    const nombres = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const delito = document.getElementById("delito").value.trim();
    const fecha = document.getElementById("fecha").value;

    const errores = [];

    if (!doc) errores.push("El número de documento es obligatorio.");
    if (!nombres) errores.push("Los nombres son obligatorios.");
    if (!apellidos) errores.push("Los apellidos son obligatorios.");
    if (!delito) errores.push("El delito es obligatorio.");
    if (!fecha) errores.push("La fecha de ingreso es obligatoria.");

    if (errores.length) {
        mostrarAlertaPresos(errores.join(" | "), "warning");
        return false;
    }

    return true;
}

function limpiarFormularioPreso() {
    document.getElementById("id_preso").value = "";
    document.getElementById("doc").value = "";
    document.getElementById("nombres").value = "";
    document.getElementById("apellidos").value = "";
    document.getElementById("delito").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("estado").value = "ACTIVO";
}

function abrirModalPreso() {
    limpiarFormularioPreso();
    const modalElement = document.getElementById("modalPreso");
    if (!modalPreso) modalPreso = new bootstrap.Modal(modalElement);
    modalPreso.show();
}

function cerrarModalPreso() {
    if (modalPreso) modalPreso.hide();
}

async function cargarPresos() {
    try {
        const res = await fetch(API_PRESOS);
        const data = await res.json();

        presosOriginal = data;
        renderizarTabla(data);
        actualizarEstadisticas(data);
    } catch (error) {
        mostrarAlertaPresos("Error cargando presos. Ver consola para detalles.", "danger");
        console.error(error);
    }
}

function renderizarTabla(presos) {
    const tabla = document.getElementById("tablaPresos");
    if (presos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="6" class="text-muted py-4">No hay presos que coincidan con los filtros</td></tr>`;
        document.getElementById("totalRegistrosPresos").textContent = "0 presos";
        return;
    }

    tabla.innerHTML = presos.map(p => `
        <tr>
            <td><strong>#${p.id_preso}</strong></td>
            <td class="text-start">${p.nombres} ${p.apellidos}</td>
            <td>${p.numero_documento}</td>
            <td>${p.delito}</td>
            <td><span class="badge ${colorEstado(p.estado)}">${p.estado}</span></td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="verDetalles(${p.id_preso})"><i class="bi bi-eye"></i> Ver</button>
                    <button class="btn btn-sm btn-warning crud-button" onclick="editarPreso(${p.id_preso})"><i class="bi bi-pencil"></i> Editar</button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById("totalRegistrosPresos").textContent = `${presos.length} preso(s)`;
}

function actualizarEstadisticas(presos) {
    const total = presos.length;
    const activos = presos.filter(p => p.estado === 'ACTIVO').length;
    const liberados = presos.filter(p => p.estado === 'LIBERADO').length;
    const trasladados = presos.filter(p => p.estado === 'TRASLADADO').length;
    const aislados = presos.filter(p => p.estado === 'EN AISLAMIENTO').length;

    document.getElementById('totalPresos').textContent = total;
    document.getElementById('estatusActivos').textContent = activos;
    document.getElementById('estatusLiberados').textContent = liberados;
    document.getElementById('estatusTrasladados').textContent = trasladados;

    if (document.getElementById('estatusAislados')) {
        document.getElementById('estatusAislados').textContent = aislados;
    }
}

async function verDetalles(id) {
    const preso = presosOriginal.find(p => p.id_preso === id);
    if (!preso) return;

    const html = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6 class="text-muted">ID del Preso</h6>
                <p class="fw-bold">${preso.id_preso}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Número de Documento</h6>
                <p class="fw-bold">${preso.numero_documento}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Nombres</h6>
                <p class="fw-bold">${preso.nombres}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Apellidos</h6>
                <p class="fw-bold">${preso.apellidos}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Delito</h6>
                <p class="fw-bold">${preso.delito}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Fecha de Ingreso</h6>
                <p class="fw-bold">${preso.fecha_ingreso ? new Date(preso.fecha_ingreso).toLocaleDateString('es-ES') : 'N/A'}</p>
            </div>
            <div class="col-12">
                <h6 class="text-muted">Estado</h6>
                <p class="fw-bold"><span class="badge ${colorEstado(preso.estado)} fs-6">${preso.estado}</span></p>
            </div>
        </div>
    `;

    document.getElementById("modalDetallesContenido").innerHTML = html;
    modalDetalles.show();
}

function filtrarPresos() {
    const documentoFiltro = document.getElementById('filtroDocumento').value.toLowerCase().trim();
    const delitoFiltro = document.getElementById('filtroDelito').value.toLowerCase().trim();
    const estadoFiltro = document.getElementById('filtroEstado').value;

    const filtrados = presosOriginal.filter(p => {
        const matchDocumento = p.numero_documento?.toLowerCase().includes(documentoFiltro);
        const matchNombre = `${p.nombres} ${p.apellidos}`.toLowerCase().includes(documentoFiltro);
        if (documentoFiltro && !(matchDocumento || matchNombre)) return false;

        if (delitoFiltro && !p.delito?.toLowerCase().includes(delitoFiltro)) return false;
        if (estadoFiltro && p.estado !== estadoFiltro) return false;

        return true;
    });

    renderizarTabla(filtrados);
    actualizarEstadisticas(filtrados);
}

function limpiarFiltrosPresos() {
    document.getElementById('filtroDocumento').value = '';
    document.getElementById('filtroDelito').value = '';
    document.getElementById('filtroEstado').value = '';
    renderizarTabla(presosOriginal);
    actualizarEstadisticas(presosOriginal);
}

async function guardarPreso() {
    if (!validarFormularioPreso()) return;

    const id_preso = document.getElementById("id_preso").value;
    const payload = {
        numero_documento: document.getElementById("doc").value.trim(),
        nombres: document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        delito: document.getElementById("delito").value.trim(),
        fecha_ingreso: document.getElementById("fecha").value,
        estado: document.getElementById("estado").value
    };

    try {
        const url = id_preso ? `${API_PRESOS}/${id_preso}` : API_PRESOS;
        const method = id_preso ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorInfo = await res.json().catch(() => ({}));
            throw new Error(errorInfo.error || "No se pudo guardar el preso.");
        }

        mostrarAlertaPresos(`Preso ${id_preso ? "actualizado" : "creado"} con éxito.`, "success");
        cerrarModalPreso();
        cargarPresos();
    } catch (error) {
        mostrarAlertaPresos(error.message, "danger");
        console.error(error);
    }
}

async function editarPreso(id) {
    try {
        const res = await fetch(`${API_PRESOS}/${id}`);
        if (!res.ok) throw new Error("Preso no encontrado");
        const p = await res.json();

        document.getElementById("id_preso").value = p.id_preso;
        document.getElementById("doc").value = p.numero_documento;
        document.getElementById("nombres").value = p.nombres;
        document.getElementById("apellidos").value = p.apellidos;
        document.getElementById("delito").value = p.delito;
        document.getElementById("fecha").value = p.fecha_ingreso?.split("T")[0] || "";
        document.getElementById("estado").value = p.estado;

        abrirModalPreso();
    } catch (error) {
        mostrarAlertaPresos(error.message, "warning");
        console.error(error);
    }
}

function colorEstado(estado) {
    const colores = {
        "ACTIVO": "bg-success",
        "TRASLADADO": "bg-info",
        "EN AISLAMIENTO": "bg-danger",
        "LIBERADO": "bg-secondary"
    };
    return colores[estado] || "bg-dark";
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
window.abrirModalPreso = abrirModalPreso;
window.verDetalles = verDetalles;
window.editarPreso = editarPreso;
window.filtrarPresos = filtrarPresos;
window.limpiarFiltrosPresos = limpiarFiltrosPresos;
window.guardarPreso = guardarPreso;

function aplicarTemaActual() {
    applyTheme(getCurrentTheme());
}

window.addEventListener('DOMContentLoaded', () => {
    modalPreso = new bootstrap.Modal(document.getElementById('modalPreso'));
    modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
    cargarPresos();
    aplicarTemaActual();

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
});
