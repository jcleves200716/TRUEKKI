document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Aquí puedes agregar la lógica de autenticación
            console.log('Username:', username);
            console.log('Password:', password);
            
            // Simulación de login exitoso
            alert('Login successful!');
        });