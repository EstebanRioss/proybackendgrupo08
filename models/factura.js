const mongoose = require('mongoose');
const { Schema } = mongoose;

const EntradaCarritoSchema = new Schema({
  tipoEntrada: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  precioUnitario: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const FacturaSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  eventoId: {
    type: Schema.Types.ObjectId,
    ref: 'Evento',
    required: true
  },
  // Carrito de entradas
  entradas: {
    type: [EntradaCarritoSchema],
    default: []
  },
  // Entrada individual
  tipoEntrada: {
    type: String
  },
  cantidad: {
    type: Number,
    min: 1
  },
  precioUnitario: {
    type: Number,
    min: 0
  },
  // Campos comunes
  total: {
    type: Number,
    required: true,
    min: 0
  },
  estado: {
    type: String,
    enum: ['pendiente', 'pagada', 'cancelada'],
    default: 'pendiente'
  },
  metodoPago: {
    type: String,
    default: 'Tarjeta de Crédito'
  },
  transaccionId: {
    type: String
  },
  mpPreferenceId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Factura', FacturaSchema);