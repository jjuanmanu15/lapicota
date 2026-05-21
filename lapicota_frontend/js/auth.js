/**
 * Sistema de autenticación simulado en el frontend
 * Maneja login, roles y permisos usando localStorage
 */

// Almacenar datos de autenticación en localStorage
function setAuth(username, role) {
    localStorage.setItem('lapicotaUser', JSON.stringify({
        username: username,
        role: role,
        loginTime: new Date().toISOString()
    }));
}

// Obtener datos de autenticación actual
function getAuth() {
    const auth = localStorage.getItem('lapicotaUser');
    return auth ? JSON.parse(auth) : null;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return getAuth() !== null;
}

// Obtener el rol del usuario actual
function getUserRole() {
    const auth = getAuth();
    return auth ? auth.role : null;
}

// Obtener el nombre del usuario actual
function getUsername() {
    const auth = getAuth();
    return auth ? auth.username : null;
}

// Verificar si el usuario es admin
function isAdmin() {
    return getUserRole() === 'admin';
}

function getLoginRedirect() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const rootMatch = path.match(/(.*\/lapicota_frontend)(?:\/.*)?$/);
    if (rootMatch) {
        return `${rootMatch[1]}/login.html`;
    }
    return 'login.html';
}

// Logout
function logout() {
    localStorage.removeItem('lapicotaUser');
    window.location.href = getLoginRedirect();
}

// Verificar autenticación y redirigir a login si no está autenticado
function checkAuthentication() {
    if (!isAuthenticated()) {
        window.location.href = getLoginRedirect();
    }
}

// Aplicar restricciones de permisos al DOM
function applyPermissions() {
    const role = getUserRole();

    if (role === 'admin') {
        // Admin tiene acceso a todo, no ocultamos nada
        return;
    }

    if (role === 'user') {
        // Usuario regular: ocultar elementos admin-only
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = 'none';
        });

        // Deshabilitar botones de CRUD
        const crudButtons = document.querySelectorAll('.crud-button');
        crudButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Acceso denegado: Solo administradores pueden editar';
        });

        // Deshabilitar botones de metaanálisis
        const metricsButtons = document.querySelectorAll('.metrics-button');
        metricsButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Acceso denegado: Solo administradores pueden ver métricas';
        });
    }
}

// Mostrar información del usuario en la topbar
function displayUserInfo() {
    const role = getUserRole();

    // Crear elemento de usuario si no existe
    let userInfoEl = document.getElementById('userInfo');
    if (!userInfoEl) {
        const topbar = document.querySelector('.topbar');
        if (topbar) {
            const userDiv = document.createElement('div');
            userDiv.id = 'userInfo';
            userDiv.className = 'd-flex align-items-center gap-2';
            topbar.appendChild(userDiv);
            userInfoEl = userDiv;
        }
    }

    if (userInfoEl) {
        const roleBadgeColor = role === 'admin' ? 'danger' : 'info';
        const roleText = role === 'admin' ? 'Administrador' : 'Lector';

        userInfoEl.innerHTML = `
            <span class="badge bg-${roleBadgeColor}">${roleText}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="logout()">
                <i class="bi bi-box-arrow-right"></i> Salir
            </button>
        `;
    }
}

// Inicializar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // No aplicar permisos en la página de login
    if (!window.location.pathname.includes('login.html')) {
        checkAuthentication();
        applyPermissions();
        displayUserInfo();
    }
});
