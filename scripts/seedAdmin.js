
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario');

// --- DATOS DEL PRIMER ADMINISTRADOR ---
// IMPORTANTE: Cambia la contraseña después de tu primer inicio de sesión.
const PRIMER_ADMIN = {
    nombre: "Kevin Brian",
    apellido: "Joel Cruz",
    email: "47082520@fi.unju.edu.ar",
    contraseñaPlana: "123456",
    rol: "administrador",
    telefono: "123456789"
};

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('La variable de entorno MONGODB_URI no está definida en tu archivo .env. Por favor, añádela para continuar.');
        }
        await mongoose.connect(mongoUri);
        console.log('Conectado a la base de datos para sembrar admin...');
        const adminExistente = await Usuario.findOne({ email: PRIMER_ADMIN.email });
        if (adminExistente) {
            console.log('El administrador con este email ya existe. No se ha creado nada.');
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const contraseñaHasheada = await bcrypt.hash(PRIMER_ADMIN.contraseñaPlana, salt);
        const admin = new Usuario({
            nombre: PRIMER_ADMIN.nombre,
            apellido: PRIMER_ADMIN.apellido,
            email: PRIMER_ADMIN.email,
            contraseña: contraseñaHasheada,
            rol: PRIMER_ADMIN.rol,
            telefono: PRIMER_ADMIN.telefono,
            estado: true,
            confirmado: true,
            estadoAprobacion: 'aprobado'
        });
        await admin.save();
        console.log('✅ ¡Primer administrador creado exitosamente!');
        console.log('Ahora puedes iniciar sesión con el email y la contraseña definidos en el script.');

    } catch (error) {
        console.error('❌ Error al crear el administrador semilla:', error.message);
    } finally {
        // 5. Desconectarse de la base de datos
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Desconectado de la base de datos.');
        }
    }
};

// Ejecutar el script
seedAdmin();
