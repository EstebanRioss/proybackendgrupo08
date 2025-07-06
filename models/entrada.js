const mongoose = require('mongoose');
const { Schema } = mongoose;

const EntradaSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la entrada es obligatorio'],
        trim: true
    },
    precio: {
        type: Number,
        required: [true, 'El precio de la entrada es obligatorio']
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de entrada es obligatorio'],
    },
    qr: {
        type: String,
        unique: true,
        sparse: true // Permite múltiples documentos con valor nulo, pero único si existe.
    },
    estado: {
        type: String,
        required: true,
        enum: ['disponible', 'vendida', 'usada', 'cancelada'],
        default: 'disponible'
    },
    // --- Relaciones ---
    usuarioId: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'La entrada debe estar asociada a un usuario']
    },
    facturaId: {
        type: Schema.Types.ObjectId,
        ref: 'Factura',
        required: [true, 'La entrada debe estar asociada a una factura']
    },
    eventoId: {
        type: Schema.Types.ObjectId,
        ref: 'Evento',
        required: [true, 'La entrada debe estar asociada a un evento']
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt
    versionKey: false
});

module.exports = mongoose.model('Entrada', EntradaSchema);

