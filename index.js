// --- DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
// Conexión a la base de datos
const { mongoose } = require('./database');

// --- INICIALIZACIÓN DEL SERVIDOR ---
const app = express();

// --- MIDDLEWARES ---
// Permite que el servidor entienda peticiones con cuerpo en formato JSON
app.use(express.json());
// Configura CORS para permitir peticiones desde tu frontend en Angular (localhost:4200)
app.use(cors({ origin: 'http://localhost:4200' }));

// --- CARGA DE RUTAS ---
// Aquí se le dice al servidor qué rutas utilizar para cada endpoint de la API.
app.use('/api/eventos', require('./routes/evento.route.js'));
app.use('/api/usuarios', require('./routes/usuario.route.js')); 

// --- CONFIGURACIÓN DEL PUERTO ---
app.set('port', process.env.PORT || 3000);

// --- INICIO DEL SERVIDOR ---
app.listen(app.get('port'), () => {
    console.log(`Servidor iniciado en el puerto`, app.get('port'));
});
