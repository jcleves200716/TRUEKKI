// Verificar si el usuario está logueado
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    if (!isLoggedIn || !usuario.id) {
        // Redirigir al login si no está autenticado
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Obtener información del usuario logueado
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('usuario') || '{}');
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Verificar sesión en el servidor (opcional)
async function verifySession() {
    try {
        const response = await fetch('http://localhost:5000/verificar-sesion');
        const result = await response.json();
        
        if (!result.success) {
            logout();
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}