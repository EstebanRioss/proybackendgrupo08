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

const crearPlantillaCorreo = (titulo, cuerpo) => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; background-color: #1a2a3a; font-family: 'Roboto', sans-serif; }
            .container { max-width: 600px; margin: 20px auto; background-color: #2a3751; border-radius: 16px; overflow: hidden; border: 1px solid #4a5a79; }
            .header { background-color: #7a5eff; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #e0e0ff; line-height: 1.6; }
            .content p { margin: 0 0 15px; }
            .content strong { color: #a58eff; }
            .footer { background-color: #283950; color: #9ea7be; text-align: center; padding: 15px; font-size: 12px; }
            .button { display: inline-block; background-color: #7a5eff; color: #ffffff; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>${titulo}</h1></div>
            <div class="content">${cuerpo}</div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} TuPlataformaDeEventos. Todos los derechos reservados.</p></div>
        </div>
    </body>
    </html>
    `;
};


emailService.enviarCorreoConfirmacion = async (email, token) => {
    const titulo = "Confirma tu Cuenta";
    const cuerpo = `
        <p>¡Gracias por registrarte, <strong>${email}</strong>!</p>
        <p>Para completar tu registro, por favor usa el siguiente código de 6 dígitos en la página de verificación:</p>
        <h2 style="text-align:center; color: #a58eff; letter-spacing: 5px;">${token}</h2>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

emailService.notificarAdminNuevoOrganizador = async (adminEmail, nuevoUsuario) => {
    const titulo = "Nueva Solicitud de Organizador";
    const cuerpo = `
        <p>Un nuevo usuario ha solicitado el rol de <strong>organizador</strong> y requiere tu aprobación.</p>
        <h3>Detalles del Solicitante:</h3>
        <ul>
            <li><strong>Nombre:</strong> ${nuevoUsuario.nombre} ${nuevoUsuario.apellido}</li>
            <li><strong>Email:</strong> ${nuevoUsuario.email}</li>
            <li><strong>Empresa:</strong> ${nuevoUsuario.nombreEmpresa || 'N/A'}</li>
        </ul>
        <p>Puedes gestionar esta solicitud en el panel de administración.</p>
        <a href="${process.env.ADMIN_PANEL_URL || '#'}/admin/solicitudes" class="button">Ir al Panel</a>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: adminEmail, subject: `Alerta: Solicitud de Rol [${nuevoUsuario.nombre}]`, html });
};

emailService.enviarCorreoEstadoSolicitud = async (email, nombre, estado) => {
    let titulo = '';
    let cuerpo = '';

    if (estado === 'aprobado') {
        titulo = "¡Tu solicitud ha sido Aprobada!";
        cuerpo = `
            <p>Hola, <strong>${nombre}</strong>.</p>
            <p>¡Felicidades! Tu solicitud para convertirte en <strong>organizador</strong> en nuestra plataforma ha sido aprobada.</p>
            <p>Ya puedes iniciar sesión y comenzar a crear y gestionar tus eventos.</p>
            <a href="${process.env.FRONTEND_URL || '#'}/login" class="button">Iniciar Sesión</a>
        `;
    } else {
        titulo = "Actualización sobre tu Solicitud";
        cuerpo = `
            <p>Hola, <strong>${nombre}</strong>.</p>
            <p>Te informamos que, tras una revisión, tu solicitud para convertirte en organizador ha sido rechazada en esta ocasión.</p>
            <p>Si crees que esto es un error o deseas más información, por favor, contacta a nuestro equipo de soporte.</p>
        `;
    }
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

emailService.enviarCorreoCambioRol = async (email, nombre, nuevoRol) => {
    const titulo = "Tu Rol ha sido Actualizado";
    const cuerpo = `
        <p>Hola, <strong>${nombre}</strong>.</p>
        <p>Te informamos que un administrador ha actualizado tu rol en nuestra plataforma.</p>
        <p>Tu nuevo rol es: <strong>${nuevoRol}</strong>.</p>
        <p>Si tienes alguna pregunta sobre este cambio, no dudes en contactar a soporte.</p>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

emailService.enviarCorreoCuentaDesactivada = async (email, nombre) => {
    const titulo = "Tu Cuenta ha sido Desactivada";
    const cuerpo = `
        <p>Hola, <strong>${nombre}</strong>.</p>
        <p>Te informamos que tu cuenta ha sido desactivada por un administrador.</p>
        <p>No podrás iniciar sesión ni acceder a nuestros servicios. Si consideras que esto es un error, por favor, contacta a nuestro equipo de soporte.</p>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};


module.exports = emailService;
