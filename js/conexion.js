
let mysql = require('mysql');

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


let conexion = mysql.createConnection({
    host: 'localhost',
    database: 'truekki',
    user: 'root',
    password: ''
}); 

conexion.connect(function(error){
    if(error){
        throw error;
    }else{
        console.log("¡Conexión exitosa!");
    }
});

app.post('/registro', async (req, res) => {
    const { nombre, email, password, confirmPassword, telefono, direccion } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password || !confirmPassword || !telefono || !direccion) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Verificar si el usuario ya existe
        const checkUserQuery = 'SELECT * FROM usuarios WHERE email = ?';
        conexion.query(checkUserQuery, [email], async (error, results) => {
            if (error) {
                console.error("Error verificando usuario:", error);
                return res.status(500).json({ success: false, message: 'Error interno del servidor' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'El email ya está registrado' });
            }

            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar nuevo usuario
            const insertUserQuery = 'INSERT INTO usuarios (nombre, email, contraseña, conf_contra, numero_telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)';
            conexion.query(insertUserQuery, [nombre, email, hashedPassword, hashedPassword, telefono, direccion], (error, results) => {
                if (error) {
                    console.error("Error insertando usuario:", error);
                    return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
                }

                console.log("Usuario registrado con ID:", results.insertId);
                res.status(200).json({ success: true, message: 'Usuario registrado exitosamente' });
            });
        });
    } catch (error) {
        console.error("Error en el proceso de registro:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});

conexion.end();
