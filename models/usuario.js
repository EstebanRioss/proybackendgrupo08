const mongoose = require('mongoose');
const { Schema } = mongoose;

const UsuarioSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contraseña: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    rol: {
        type: String,
        required: true,
        enum: ['usuario', 'organizador', 'administrador'],
        default: 'usuario'
    },
    estado: { type: Boolean, default: true },
    telefono: { type: String, required: false },
    confirmado: { type: Boolean, default: false },
    tokenConfirmacion: { type: String, default: null },
    estadoAprobacion: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'aprobado'
},
    nombreEmpresa: { type: String, required: false },
    cuit: { type: String, required: false },
    descripcion: { type: String, required: false }
    
});

module.exports = mongoose.model('Usuario', UsuarioSchema);