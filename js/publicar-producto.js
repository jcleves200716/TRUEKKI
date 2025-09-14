document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-publicacion');
    const mensajeExito = document.getElementById('mensaje-exito');
    
    // Elementos de validación
    const elementosValidacion = {
        categoria: document.getElementById('val-categoria'),
        estado: document.getElementById('val-estado'),
        foto: document.getElementById('val-foto'),
        descripcion: document.getElementById('val-descripcion'),
        palabras: document.getElementById('val-palabras'),
        ubicacion: document.getElementById('val-ubicacion')
    };

    const camposFormulario = {
        categoria: document.getElementById('categoria'),
        estado: document.getElementById('estado'),
        foto: document.getElementById('foto'),
        descripcion: document.getElementById('descripcion'),
        ciudad: document.getElementById('ciudad'),
        barrio: document.getElementById('barrio'),
        titulo: document.getElementById('titulo'),
        precio: document.getElementById('precio')
    };

    // Palabras prohibidas
    const palabrasProhibidas = ['estafa', 'fraude', 'gratis', 'regalo', 'oferta', 'gana', 'dinero', 'fácil', 'rápido'];

    // Función para verificar palabras prohibidas
    function contienePalabrasProhibidas(texto) {
        return palabrasProhibidas.some(palabra => 
            texto.toLowerCase().includes(palabra.toLowerCase())
        );
    }

    // Función para actualizar la validación
    function actualizarValidacion() {
        // Validar categoría
        if (camposFormulario.categoria.value) {
            elementosValidacion.categoria.classList.add('valido');
            camposFormulario.categoria.classList.add('valido');
        } else {
            elementosValidacion.categoria.classList.remove('valido');
            camposFormulario.categoria.classList.remove('valido');
        }

        // Validar estado
        if (camposFormulario.estado.value) {
            elementosValidacion.estado.classList.add('valido');
            camposFormulario.estado.classList.add('valido');
        } else {
            elementosValidacion.estado.classList.remove('valido');
            camposFormulario.estado.classList.remove('valido');
        }

        // Validar foto
        if (camposFormulario.foto.files.length > 0) {
            elementosValidacion.foto.classList.add('valido');
        } else {
            elementosValidacion.foto.classList.remove('valido');
        }

        // Validar descripción
        if (camposFormulario.descripcion.value.length >= 50) {
            elementosValidacion.descripcion.classList.add('valido');
            camposFormulario.descripcion.classList.add('valido');
        } else {
            elementosValidacion.descripcion.classList.remove('valido');
            camposFormulario.descripcion.classList.remove('valido');
        }

        // Validar palabras prohibidas
        const textoCompleto = [
            camposFormulario.titulo.value, 
            camposFormulario.descripcion.value
        ].join(' ');
        
        if (!contienePalabrasProhibidas(textoCompleto)) {
            elementosValidacion.palabras.classList.add('valido');
        } else {
            elementosValidacion.palabras.classList.remove('valido');
        }

        // Validar ubicación
        if (camposFormulario.ciudad.value && camposFormulario.barrio.value) {
            elementosValidacion.ubicacion.classList.add('valido');
            camposFormulario.ciudad.classList.add('valido');
            camposFormulario.barrio.classList.add('valido');
        } else {
            elementosValidacion.ubicacion.classList.remove('valido');
            camposFormulario.ciudad.classList.remove('valido');
            camposFormulario.barrio.classList.remove('valido');
        }
    }

    // Añadir event listeners a todos los campos
    Object.values(camposFormulario).forEach(campo => {
        if (campo) {
            campo.addEventListener('input', actualizarValidacion);
            campo.addEventListener('change', actualizarValidacion);
        }
    });

    // Validar el formulario al enviar
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        actualizarValidacion();
        
        // Verificar si todos los campos de validación están en verde
        const todosValidos = Object.values(elementosValidacion)
            .every(elemento => elemento.classList.contains('valido'));
        
        if (todosValidos) {
            // Obtener método de contacto seleccionado
            const contacto = document.querySelector('input[name="contacto"]:checked').value;
            
            // ID de usuario temporal (deberías obtenerlo de la sesión)
            const idUsuario = 1;
            
            // Crear objeto producto
            const producto = {
                titulo: camposFormulario.titulo.value,
                categoria: camposFormulario.categoria.value,
                estado: camposFormulario.estado.value,
                descripcion: camposFormulario.descripcion.value,
                precio: camposFormulario.precio.value,
                ciudad: camposFormulario.ciudad.value,
                barrio: camposFormulario.barrio.value,
                contacto: contacto,
                id_usuario: idUsuario,
                foto: camposFormulario.foto.files[0]
            };
            
            try {
                // 1. Publicar los datos del producto
                const response = await fetch('http://localhost:5000/publicar-producto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(producto)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // 2. Si hay imagen, subirla por separado
                    if (producto.foto) {
                        const formData = new FormData();
                        formData.append('foto', producto.foto);
                        
                        const imageResponse = await fetch(`http://localhost:5000/subir-imagen-producto/${result.id}`, {
                            method: 'POST',
                            body: formData
                        });
                        
                        const imageResult = await imageResponse.json();
                        
                        if (!imageResult.success) {
                            console.error("Error subiendo imagen:", imageResult.message);
                        }
                    }
                    
                    // Mostrar mensaje de éxito
                    mensajeExito.style.display = 'block';
                    form.reset();
                    
                    // Desplazarse al mensaje de éxito
                    mensajeExito.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error("Error:", error);
                alert('Error al publicar el producto');
            }
        } else {
            alert('Por favor, complete todos los campos correctamente.');
        }
    });
    
    // Validación inicial
    actualizarValidacion();
});