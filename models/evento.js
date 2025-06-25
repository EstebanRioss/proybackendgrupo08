const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  fecha: { type: Date, required: true },
  ubicacionNombre: String,
  latitud: String,
  longitud: String,
  capacidadTotal: { type: Number, required: true },
  imagenUrl: String,
  estado: { type: Boolean, default: true },
  categoriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaEvento' },
  organizadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
},{ timestamps: true });

module.exports = mongoose.model('Evento', eventoSchema);