// Función para redireccionar a la página de login
function redirectToLogin() {
    window.location.href = "../vistas/login.html";
}

// Función para redireccionar a la página de registro
function redirectToRegister() {
    window.location.href = "../vistas/registro.html";
}

// Función para manejar el envío del formulario de login
function handleLogin(event) {
    event.preventDefault();
    // Aquí iría la lógica de autenticación
    alert("Inicio de sesión exitoso (simulado)");
    // Redireccionar a la página principal después del login
    // window.location.href = "index.html";
}

// Función para manejar el envío del formulario de registro
function handleRegister(event) {
    event.preventDefault();
    // Aquí iría la lógica de registro
    alert("Registro exitoso (simulado)");
    // Redireccionar a la página de login después del registro
    // window.location.href = "login.html";
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Asignar event listeners para los botones en la página principal
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', redirectToLogin);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', redirectToRegister);
    }
    
    // Asignar event listeners para los formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});