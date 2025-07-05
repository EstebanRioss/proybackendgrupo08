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
    usuarioId: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'La factura debe estar asociada a un usuario']
    }
    // La relación con Entrada es inversa y se establece en el modelo Entrada (campo facturaId).
    }, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Factura', FacturaSchema);
