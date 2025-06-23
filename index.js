const express = require('express');
const cors = require('cors');
const { mongoose } = require('./database');
var app = express();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:4200' }));

app.use('/api/usuario', require('./routes/usuario.route.js'));

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
    console.log(`Servidor iniciado en el puerto`, app.get('port'));
});