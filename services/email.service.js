const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: "gmail",            
    auth: {
        user: process.env.user,
        pass: process.env.pass,
    }
});

const emailService = {};

emailService.enviarCorreoConfirmacion = async (email, token) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.user, 
            to: email,
            subject: `Confirma tu cuenta para ${email}`,
            html: `<p>¡Gracias por registrarte, <strong>${email}</strong>!</p>
                   <p>Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
                   <p>Tu codigo es ${token}</p>
                   <p>(Este correo fue enviado a la bandeja de prueba del desarrollador).</p>`
        });

        console.log(`Correo de confirmación para ${email} enviado a la bandeja de prueba. Message ID:`, info.messageId);
    } catch (error) {
        console.error("--- ERROR AL ENVIAR EMAIL (MODO DESARROLLO) ---");
        console.error("El correo no se pudo enviar. Revisa la consola para más detalles.");
        console.error("Detalle del error:", error.message);
    }
};

emailService.notificarAdminNuevoOrganizador = async (adminEmail, nuevoUsuario) => {
    
    try {
        const info = await transporter.sendMail({
            from: process.env.user,
            to: adminEmail,
            subject: `Alerta: Nuevo Usuario [${nuevoUsuario.rol}] Requiere Aprobación`,
            html: `<p>Un nuevo usuario se ha registrado como <strong>${nuevoUsuario.rol}</strong> y requiere tu aprobación.</p>
                   <ul>
                     <li><strong>Nombre:</strong> ${nuevoUsuario.nombre} ${nuevoUsuario.apellido}</li>
                     <li><strong>Email:</strong> ${nuevoUsuario.email}</li>
                   </ul>
                   <p>Revisa la solicitud en el <a href="${adminPanelUrl}">panel de administración</a>.</p>
                   <p>(Este correo fue enviado a la bandeja de prueba del desarrollador. Originalmente para: ${adminEmail}).</p>`
        });

        console.log(`Correo de notificación para ${adminEmail} enviado a la bandeja de prueba. Message ID:`, info.messageId);
    } catch (error) {
        console.error("Error al notificar al admin con Nodemailer:", error.message);
    }
};
emailService.enviarCorreoCambioContrasena = async (email, nombre) => {

    try {
        const info = await transporter.sendMail({
            from: '"Alerta de Seguridad - Eventos PYSW" process.env.pass',
            to: email, // Enviar al email de prueba
            subject: `Alerta: Tu contraseña ha sido cambiada para ${email}`,
            html: `<p>Hola, <strong>${nombre}</strong>.</p>
                   <p>Te informamos que la contraseña de tu cuenta ha sido cambiada exitosamente.</p>
                   <p>Si no realizaste este cambio, por favor, contacta a soporte inmediatamente.</p>
                   <p>(Este correo fue enviado a la bandeja de prueba del desarrollador. Originalmente para: ${email}).</p>`
        });

        console.log(`Correo de notificación de cambio de contraseña para ${email} enviado a la bandeja de prueba. Message ID:`, info.messageId);
    } catch (error) {
        console.error("Error al notificar cambio de contraseña con Nodemailer:", error.message);
    }
};

module.exports = emailService;
