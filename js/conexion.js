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


// ✅ REGISTRO MODIFICADO - Sin teléfono y dirección obligatorios
app.post('/registro', async (req, res) => {
    const { nombre, email, password, confirmPassword } = req.body;

    const dominiosValidos = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

    function validarDominio(email) {
        const dominio = email.split('@')[1].toLowerCase();
        return dominiosValidos.includes(dominio);
    }

    // Validación de email
    if (!validarDominio(email)) {
        return res.status(400).json({ success: false, message: 'Dominio de correo no válido' });
    }

    // ✅ VALIDACIÓN CORREGIDA - Solo campos esenciales
    if (!nombre || !email || !password) {
        return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
    }

    // Validar confirmación de contraseña si está presente
    if (confirmPassword && password !== confirmPassword) {
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
            
            // ✅ INSERT modificado - teléfono y dirección como NULL por defecto
            const insertUserQuery = 'INSERT INTO usuario (nombre, email, contraseña, numero_telefono, direccion) VALUES (?, ?, ?, NULL, NULL)';
            
            conexion.query(insertUserQuery, [nombre, email, hashedPassword], (error, results) => {
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

// ✅ Ruta para eliminar producto - VERSIÓN CORREGIDA
app.delete('/producto/:id', (req, res) => {
    const productId = req.params.id;
    
    if (!productId || isNaN(productId)) {
        console.log("❌ ID inválido:", productId);
        return res.status(400).json({ success: false, message: 'ID de producto inválido' });
    }

    // Primero verificamos que el producto exista
    const checkQuery = 'SELECT * FROM productos WHERE id_producto = ?';
    
    conexion.query(checkQuery, [productId], (error, results) => {
        if (error) {
            console.error("❌ Error en consulta de verificación:", error);
            return res.status(500).json({ success: false, message: 'Error al verificar producto' });
        }
        
        if (results.length === 0) {
            console.log("❌ Producto no encontrado ID:", productId);
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        // Eliminar el producto
        const deleteQuery = 'DELETE FROM productos WHERE id_producto = ?';
        
        conexion.query(deleteQuery, [productId], (error, results) => {
            if (error) {
                console.error("❌ Error eliminando producto:", error);
                return res.status(500).json({ success: false, message: 'Error al eliminar producto: ' + error.message });
            }
            
            console.log(" Producto eliminado exitosamente ID:", productId);
            res.status(200).json({ 
                success: true, 
                message: 'Producto eliminado exitosamente',
                deletedId: productId
            });
        });
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

// ✅ RUTAS PARA FAVORITOS

// Agregar producto a favoritos
app.post('/favoritos/agregar', (req, res) => {
    const { id_usuario, id_producto } = req.body;
    
    console.log("📍 Agregando a favoritos - Usuario:", id_usuario, "Producto:", id_producto);
    
    if (!id_usuario || !id_producto) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }
    
    // Verificar si el producto existe
    const checkProductQuery = 'SELECT * FROM productos WHERE id_producto = ?';
    conexion.query(checkProductQuery, [id_producto], (error, results) => {
        if (error) {
            console.error("❌ Error verificando producto:", error);
            return res.status(500).json({ success: false, message: 'Error al verificar producto' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        // Verificar si ya está en favoritos
        const checkFavoriteQuery = 'SELECT * FROM favoritos WHERE id_usuario = ? AND id_producto = ?';
        conexion.query(checkFavoriteQuery, [id_usuario, id_producto], (error, results) => {
            if (error) {
                console.error("❌ Error verificando favorito:", error);
                return res.status(500).json({ success: false, message: 'Error al verificar favorito' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'El producto ya está en favoritos' });
            }
            
            // Agregar a favoritos
            const insertQuery = 'INSERT INTO favoritos (id_usuario, id_producto) VALUES (?, ?)';
            conexion.query(insertQuery, [id_usuario, id_producto], (error, results) => {
                if (error) {
                    console.error("❌ Error agregando a favoritos:", error);
                    return res.status(500).json({ success: false, message: 'Error al agregar a favoritos' });
                }
                
                console.log("✅ Producto agregado a favoritos ID:", results.insertId);
                res.status(200).json({ 
                    success: true, 
                    message: 'Producto agregado a favoritos',
                    id_favorito: results.insertId
                });
            });
        });
    });
});

// Eliminar producto de favoritos
app.post('/favoritos/eliminar', (req, res) => {
    const { id_usuario, id_producto } = req.body;
    
    console.log("📍 Eliminando de favoritos - Usuario:", id_usuario, "Producto:", id_producto);
    
    if (!id_usuario || !id_producto) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }
    
    const deleteQuery = 'DELETE FROM favoritos WHERE id_usuario = ? AND id_producto = ?';
    conexion.query(deleteQuery, [id_usuario, id_producto], (error, results) => {
        if (error) {
            console.error("❌ Error eliminando de favoritos:", error);
            return res.status(500).json({ success: false, message: 'Error al eliminar de favoritos' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado en favoritos' });
        }
        
        console.log("✅ Producto eliminado de favoritos");
        res.status(200).json({ 
            success: true, 
            message: 'Producto eliminado de favoritos'
        });
    });
});

// Obtener favoritos de un usuario
app.get('/favoritos/usuario/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario;
    
    console.log("📍 Obteniendo favoritos del usuario:", idUsuario);
    
    const query = `
        SELECT p.*, u.nombre as usuario_nombre, f.fecha_agregado 
        FROM favoritos f 
        JOIN productos p ON f.id_producto = p.id_producto 
        JOIN usuario u ON p.id_usuario = u.id_usuario 
        WHERE f.id_usuario = ? 
        ORDER BY f.fecha_agregado DESC
    `;
    
    conexion.query(query, [idUsuario], (error, results) => {
        if (error) {
            console.error("❌ Error obteniendo favoritos:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener favoritos' });
        }
        
        console.log("✅ Favoritos encontrados:", results.length);
        res.status(200).json({ 
            success: true, 
            favoritos: results 
        });
    });
});

// Verificar si un producto está en favoritos
app.get('/favoritos/verificar/:idUsuario/:idProducto', (req, res) => {
    const { idUsuario, idProducto } = req.params;
    
    const query = 'SELECT * FROM favoritos WHERE id_usuario = ? AND id_producto = ?';
    conexion.query(query, [idUsuario, idProducto], (error, results) => {
        if (error) {
            console.error("❌ Error verificando favorito:", error);
            return res.status(500).json({ success: false, message: 'Error al verificar favorito' });
        }
        
        res.status(200).json({ 
            success: true, 
            esFavorito: results.length > 0 
        });
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

// ✅ Ruta para obtener un producto específico con información del vendedor
app.get('/producto/:id', (req, res) => {
    const productId = req.params.id;
    
    const query = `
        SELECT p.*, u.nombre as vendedor_nombre, u.numero_telefono, u.email 
        FROM productos p 
        JOIN usuario u ON p.id_usuario = u.id_usuario 
        WHERE p.id_producto = ?
    `;
    
    conexion.query(query, [productId], (error, results) => {
        if (error) {
            console.error("Error obteniendo producto:", error);
            return res.status(500).json({ success: false, message: 'Error al obtener producto' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const producto = results[0];
        const vendedor = {
            id: producto.id_usuario,
            nombre: producto.vendedor_nombre,
            telefono: producto.numero_telefono,
            email: producto.email
        };
        
        // Remover datos del vendedor del objeto producto
        delete producto.vendedor_nombre;
        delete producto.numero_telefono;
        delete producto.email;
        
        res.status(200).json({ 
            success: true, 
            producto: producto,
            vendedor: vendedor
        });
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
    console.log(`Registro: http://localhost:${port}/vistas/registro.html`);
    console.log(`Login: http://localhost:${port}/vistas/login.html`);
});