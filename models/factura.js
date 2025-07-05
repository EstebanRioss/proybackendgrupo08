const mongoose = require('mongoose');
const { Schema } = mongoose;

const FacturaSchema = new Schema({
    total: {
        type: Number,
        required: [true, 'El monto total es obligatorio']
    },
    estado: {
        type: String,
        required: true,
        enum: ['pagada', 'pendiente', 'cancelada'],
        default: 'pendiente'
    },
    metodoPago: {
        type: String,
        required: [true, 'El método de pago es obligatorio'],
        enum: ['Tarjeta de Crédito', 'PayPal', 'Transferencia Bancaria', 'Efectivo']
    },
    transaccionId: {
        type: String,
        trim: true,
        sparse: true
    },
    // --- Relaciones ---
    entradaId: {
        type: Schema.Types.ObjectId,
        ref: 'Entrada',
        required: [true, 'La factura debe estar asociada a alguna entrada']
    }
    }, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Factura', FacturaSchema);

