const mongoose = require('mongoose');

const CategoriaEventoSchema = new mongoose.Schema({
    nombre: {type: String,required: true},
    descripcion: {type: String,required: false} 
},{
    timestamps: true
});

module.exports = mongoose.model('CategoriaEvento', CategoriaEventoSchema);