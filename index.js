require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { mongoose } = require('./database');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: 'http://localhost:4200' }));

// Rutas
app.use('/api/eventos', require('./routes/evento.route.js'));
app.use('/api/usuarios', require('./routes/usuario.route.js')); 

// Configuración del puerto
app.set('port', process.env.PORT || 3000);

// Iniciar servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor iniciado en el puerto`, app.get('port'));
});
