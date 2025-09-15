let mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Configuración de multer para imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Conexión a MySQL
let conexion = mysql.createConnection({
    host: 'localhost',
    database: 'truekki',
    user: 'root',
    password: ''
});

conexion.connect(function(error){
    if(error){
        console.error("Error de conexión:", error);
    }else{
        console.log("¡Conexión exitosa!");
    }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../')));

// Rutas para páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/vistas/registro.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../vistas/registro.html'));
});

app.get('/vistas/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../vistas/login.html'));
});

// Registro de usuario (EXISTENTE - sin cambios)
app.post('/registro', async (req, res) => {
    const { nombre, email, password, confirmPassword, telefono, direccion } = req.body;

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
        const checkUserQuery = 'SELECT * FROM usuario WHERE email = ?';
        conexion.query(checkUserQuery, [email], async (error, results) => {
            if (error) {
                console.error("Error verificando usuario:", error);
                return res.status(500).json({ success: false, message: 'Error interno del servidor' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'El email ya está registrado' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertUserQuery = 'INSERT INTO usuario (nombre, email, contraseña, numero_telefono, direccion) VALUES (?, ?, ?, ?, ?)';
            
            conexion.query(insertUserQuery, [nombre, email, hashedPassword, telefono, direccion], (error, results) => {
                if (error) {
                    console.error("Error insertando usuario:", error);
                    return res.status(500).json({ success: false, message: 'Error al registrar usuario: ' + error.message });
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

// ✅ Ruta para login de usuario
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    try {
        // Buscar usuario por email
        const query = 'SELECT * FROM usuario WHERE email = ?';
        conexion.query(query, [email], async (error, results) => {
            if (error) {
                console.error("Error buscando usuario:", error);
                return res.status(500).json({ success: false, message: 'Error interno del servidor' });
            }

            if (results.length === 0) {
                return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            }

            const usuario = results[0];

            // Verificar contraseña
            const passwordMatch = await bcrypt.compare(password, usuario.contraseña);
            
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            }

            // Verificar si el usuario está activo
            if (usuario.estado !== 'activo') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Tu cuenta está ' + (usuario.estado === 'bloqueado' ? 'bloqueada' : 'inactiva') 
                });
            }

            // Login exitoso
            res.status(200).json({ 
                success: true, 
                message: 'Login exitoso',
                usuario: {
                    id: usuario.id_usuario,
                    nombre: usuario.nombre,
                    email: usuario.email
                }
            });
        });
    } catch (error) {
        console.error("Error en el proceso de login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ✅ NUEVAS RUTAS PARA PRODUCTOS

// Obtener todos los productos
app.get('/productos', (req, res) => {
    const query = 'SELECT p.*, u.nombre as usuario_nombre FROM productos p JOIN usuario u ON p.id_usuario = u.id_usuario ORDER BY p.fecha_publicacion DESC';
    
    conexion.query(query, (error, results) => {
        if (error) {
            console.error("Error obteniendo productos:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener productos' });
        }
        
        res.status(200).json({ success: true, productos: results });
    });
});

// Publicar nuevo producto (sin imagen)
app.post('/publicar-producto', (req, res) => {
    const { titulo, categoria, estado, descripcion, precio, ciudad, barrio, contacto, id_usuario } = req.body;
    
    if (!titulo || !categoria || !estado || !descripcion || !precio || !ciudad || !barrio || !contacto || !id_usuario) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }
    
    if (descripcion.length < 50) {
        return res.status(400).json({ success: false, message: 'La descripción debe tener al menos 50 caracteres' });
    }
    
    const query = 'INSERT INTO productos (titulo, categoria, estado, descripcion, precio, ciudad, barrio, contacto, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    conexion.query(query, [titulo, categoria, estado, descripcion, precio, ciudad, barrio, contacto, id_usuario], (error, results) => {
        if (error) {
            console.error("Error insertando producto:", error);
            return res.status(500).json({ success: false, message: 'Error al publicar producto' });
        }
        
        console.log("Producto publicado con ID:", results.insertId);
        res.status(200).json({ success: true, message: 'Producto publicado exitosamente', id: results.insertId });
    });
});

// Subir imagen de producto
app.post('/subir-imagen-producto/:id', upload.single('foto'), (req, res) => {
    const productId = req.params.id;
    const image = req.file;
    
    if (!image) {
        return res.status(400).json({ success: false, message: 'No se ha subido ninguna imagen' });
    }
    
    const query = 'UPDATE productos SET foto = ?, foto_nombre = ? WHERE id_producto = ?';
    
    conexion.query(query, [image.buffer, image.originalname, productId], (error, results) => {
        if (error) {
            console.error("Error subiendo imagen:", error);
            return res.status(500).json({ success: false, message: 'Error al subir imagen' });
        }
        
        res.status(200).json({ success: true, message: 'Imagen subida exitosamente' });
    });
});

// Obtener imagen de producto
app.get('/imagen-producto/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'SELECT foto, foto_nombre FROM productos WHERE id_producto = ?';
    
    conexion.query(query, [productId], (error, results) => {
        if (error) {
            console.error("Error obteniendo imagen:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener imagen' });
        }
        
        if (results.length === 0 || !results[0].foto) {
            return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
        }
        
        const image = results[0].foto;
        const imageName = results[0].foto_nombre || 'producto.jpg';
        
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': image.length,
            'Content-Disposition': `inline; filename="${imageName}"`
        });
        
        res.end(image);
    });
});

// Obtener productos por usuario
app.get('/productos-usuario/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario;
    const query = 'SELECT * FROM productos WHERE id_usuario = ? ORDER BY fecha_publicacion DESC';
    
    conexion.query(query, [idUsuario], (error, results) => {
        if (error) {
            console.error("Error obteniendo productos del usuario:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener productos' });
        }
        
        res.status(200).json({ success: true, productos: results });
    });
});



// ✅ Ruta para obtener información del usuario por ID
app.get('/usuario/:id', (req, res) => {
    const userId = req.params.id;
    
    const query = 'SELECT id_usuario, nombre, email, numero_telefono, direccion, fecha_registro, verificado, estado FROM usuario WHERE id_usuario = ?';
    
    conexion.query(query, [userId], (error, results) => {
        if (error) {
            console.error("Error obteniendo usuario:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener información del usuario' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        res.status(200).json({ success: true, usuario: results[0] });
    });
});

// ✅ Ruta para actualizar información del usuario
app.put('/usuario/:id', (req, res) => {
    const userId = req.params.id;
    const { nombre, numero_telefono, direccion, bio } = req.body;
    
    const query = 'UPDATE usuario SET nombre = ?, numero_telefono = ?, direccion = ?, bio = ? WHERE id_usuario = ?';
    
    conexion.query(query, [nombre, numero_telefono, direccion, bio, userId], (error, results) => {
        if (error) {
            console.error("Error actualizando usuario:", error);
            return res.status(500).json({ success: false, message: 'Error al actualizar información del usuario' });
        }
        
        res.status(200).json({ success: true, message: 'Información actualizada correctamente' });
    });
});

// ✅ Ruta para obtener productos de un usuario específico
app.get('/productos-usuario/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario;
    
    const query = `
        SELECT p.*, 
               (SELECT COUNT(*) FROM intercambio i WHERE i.id_producto1 = p.id_producto OR i.id_producto2 = p.id_producto) as intercambios_realizados
        FROM productos p 
        WHERE p.id_usuario = ? 
        ORDER BY p.fecha_publicacion DESC
    `;
    
    conexion.query(query, [idUsuario], (error, results) => {
        if (error) {
            console.error("Error obteniendo productos del usuario:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener productos' });
        }
        
        res.status(200).json({ success: true, productos: results });
    });
});


// Verificar si el usuario está logueado
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    if (!isLoggedIn || !usuario.id) {
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

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
    console.log(`Registro: http://localhost:${port}/vistas/registro.html`);
    console.log(`Login: http://localhost:${port}/vistas/login.html`);
});