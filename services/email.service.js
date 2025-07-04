const nodemailer = require('nodemailer');

console.log('Clave de API de Resend para Nodemailer:', process.env.RESEND_API_KEY ? 'Cargada correctamente' : 'ERROR: NO CARGADA');

const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com', 
    port: 465,               
    secure: true,            
    auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
    }
});

const emailService = {};

emailService.enviarCorreoConfirmacion = async (email, token) => {
    const confirmacionUrl = `${process.env.FRONTEND_URL}/confirmar-email/${token}`;

    const emailDePrueba = '47082520@fi.unju.edu.ar';

    try {
        const info = await transporter.sendMail({
            from: '"Eventos PYSW" <onboarding@resend.dev>', 
            to: emailDePrueba,
            subject: `Confirma tu cuenta para ${email}`,
            html: `<p>¡Gracias por registrarte, <strong>${email}</strong>!</p>
                   <p>Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
                   <p><a href="${confirmacionUrl}" style="color: blue; text-decoration: underline;"><strong>Confirmar mi cuenta</strong></a></p>
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
    const adminPanelUrl = `${process.env.FRONTEND_URL}/admin/usuarios`; 
    const emailDePrueba = '47082520@fi.unju.edu.ar';
    
    try {
        const info = await transporter.sendMail({
            from: '"Alerta del Sistema" <onboarding@resend.dev>',
            to: emailDePrueba,
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
    const emailDePrueba = '47082520@fi.unju.edu.ar'; // Tu email de prueba

    try {
        const info = await transporter.sendMail({
            from: '"Alerta de Seguridad - Eventos PYSW" <onboarding@resend.dev>',
            to: emailDePrueba, // Enviar al email de prueba
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
