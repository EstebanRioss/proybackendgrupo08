// email.service.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Configuración del transportador de correo
//    Utiliza el servicio de Gmail y credenciales desde variables de entorno.
//    Es fundamental usar una "Contraseña de Aplicación" de Google si tenés 2FA activado.
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.user,
        pass: process.env.pass, 
    }
});

// 2. Función auxiliar para crear plantillas de correo HTML
//    Centraliza el diseño de los correos para mantener la consistencia.
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
            <div class="footer"><p>&copy; ${new Date().getFullYear()} Pases. Todos los derechos reservados.</p></div>
        </div>
    </body>
    </html>
    `;
};

// 3. Objeto que encapsula y exporta todas las funciones del servicio
const emailService = {};

// --- Definición de las funciones del servicio ---

/**
 * Envía un correo para que el usuario confirme su cuenta con un token.
 * @param {string} email - Email del destinatario.
 * @param {string} token - Token de 6 dígitos para la confirmación.
 */
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

emailService.enviarCompraEntrada = async (email, imagenBase64) => {
    const titulo = "Gracias por comprar tu entrada";
    const cuerpo = `
        <p>¡Gracias por comprar tu entrada, <strong>${email}</strong>!</p>
        <p>Acaba de comprar una entrada. Se le adjunta su correspondiente QR para poder asistir al evento.</p>
        <div style="text-align:center; margin-top:20px;">
            <img src="cid:qrimage" alt="Entrada" style="max-width:100%; height:auto;" />
        </div>
    `;

    const html = crearPlantillaCorreo(titulo, cuerpo);

    await transporter.sendMail({
        from: process.env.user,
        to: email,
        subject: titulo,
        html,
        attachments: [
            {
                filename: 'qr.png',
                content: imagenBase64.split("base64,")[1], // quitamos el encabezado data:image/png...
                encoding: 'base64',
                cid: 'qrimage' // este ID se usa en el src del <img>
            }
        ]
    });

    console.log("Se envió el correo con QR adjunto.");
};

/**
 * Notifica a un administrador sobre una nueva solicitud de rol de organizador.
 * @param {string} adminEmail - Email del administrador a notificar.
 * @param {object} nuevoUsuario - Objeto del usuario que solicita el rol.
 */
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

/**
 * Informa a un usuario si su solicitud de rol fue aprobada o rechazada.
 * @param {string} email - Email del usuario.
 * @param {string} nombre - Nombre del usuario.
 * @param {'aprobado'|'rechazado'} estado - El estado de la solicitud.
 */
emailService.enviarCorreoEstadoSolicitud = async (email, nombre, estado) => {
    let titulo = '';
    let cuerpo = '';

    if (estado === 'aprobado') {
        titulo = "¡Tu solicitud ha sido Aprobada!";
        cuerpo = `
            <p>Hola, <strong>${nombre}</strong>.</p>
            <p>¡Felicidades! Tu solicitud para convertirte en <strong>organizador</strong> en nuestra plataforma ha sido aprobada.</p>
            <p>Ya podés iniciar sesión y comenzar a crear y gestionar tus eventos.</p>
            <a href="${process.env.FRONTEND_URL || '#'}/login" class="button">Iniciar Sesión</a>
        `;
    } else {
        titulo = "Actualización sobre tu Solicitud";
        cuerpo = `
            <p>Hola, <strong>${nombre}</strong>.</p>
            <p>Te informamos que, tras una revisión, tu solicitud para convertirte en organizador ha sido rechazada en esta ocasión.</p>
            <p>Si creés que esto es un error o deseás más información, por favor, contactá a nuestro equipo de soporte.</p>
        `;
    }
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

/**
 * Notifica a un usuario sobre un cambio de rol en su cuenta.
 * @param {string} email - Email del usuario.
 * @param {string} nombre - Nombre del usuario.
 * @param {string} nuevoRol - El nuevo rol asignado.
 */
emailService.enviarCorreoCambioRol = async (email, nombre, nuevoRol) => {
    const titulo = "Tu Rol ha sido Actualizado";
    const cuerpo = `
        <p>Hola, <strong>${nombre}</strong>.</p>
        <p>Te informamos que un administrador ha actualizado tu rol en nuestra plataforma.</p>
        <p>Tu nuevo rol es: <strong>${nuevoRol}</strong>.</p>
        <p>Si tenés alguna pregunta sobre este cambio, no dudes en contactar a soporte.</p>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

/**
 * Informa a un usuario que su cuenta ha sido desactivada.
 * @param {string} email - Email del usuario.
 * @param {string} nombre - Nombre del usuario.
 */
emailService.enviarCorreoCuentaDesactivada = async (email, nombre) => {
    const titulo = "Tu Cuenta ha sido Desactivada";
    const cuerpo = `
        <p>Hola, <strong>${nombre}</strong>.</p>
        <p>Te informamos que tu cuenta ha sido desactivada por un administrador.</p>
        <p>No podrás iniciar sesión ni acceder a nuestros servicios. Si considerás que esto es un error, por favor, contactá a nuestro equipo de soporte.</p>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

/**
 * Confirma a un usuario que su contraseña fue cambiada exitosamente.
 * @param {string} email - Email del usuario.
 * @param {string} nombre - Nombre del usuario.
 */
emailService.enviarCorreoCambioContrasena = async (email, nombre) => {
    const titulo = "Tu Contraseña ha sido Cambiada";
    const cuerpo = `
        <p>Hola, <strong>${nombre}</strong>.</p>
        <p>Te informamos que la contraseña de tu cuenta ha sido actualizada con éxito.</p>
        <p>Si no realizaste este cambio, por favor, contactá a nuestro equipo de soporte de inmediato.</p>
    `;
    const html = crearPlantillaCorreo(titulo, cuerpo);
    await transporter.sendMail({ from: process.env.user, to: email, subject: titulo, html });
};

// 4. Exportación del objeto del servicio para que pueda ser usado en otros archivos
module.exports = emailService;
