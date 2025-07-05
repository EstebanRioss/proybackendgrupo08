const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/email.service');

const SUPER_ADMIN_EMAIL = '47082520@fi.unju.edu.ar';
const usuarioCtrl = {};

usuarioCtrl.createUsuario = async (req, res) => {
    try {
        const { email, contraseña, rol } = req.body;
        if (await Usuario.findOne({ email })) {
            return res.status(400).json({ msg: 'El email ya está en uso.' });
        }
        const tokenConfirmacion = (parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000 + 100000).toString();
        
        const nuevoUsuario = new Usuario({ ...req.body, tokenConfirmacion });

        if (rol === 'organizador' || rol === 'administrador') {
            nuevoUsuario.estadoAprobacion = 'pendiente';
        } else {
            nuevoUsuario.estadoAprobacion = 'aprobado';
        }

        nuevoUsuario.contraseña = await bcrypt.hash(contraseña, 10);
        await nuevoUsuario.save();

        await emailService.enviarCorreoConfirmacion(nuevoUsuario.email, tokenConfirmacion);

        if (rol === 'organizador' || rol === 'administrador') {
            const admins = await Usuario.find({ rol: 'administrador' });
            admins.forEach(admin => {
                if(admin.email !== nuevoUsuario.email) {
                    emailService.notificarAdminNuevoOrganizador(admin.email, nuevoUsuario);
                }
            });
        }
        
        res.status(201).json({ msg: 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.' });

    } catch (error) {
        res.status(400).json({ msg: 'Error al registrar el usuario.', error: error.message });
    }
};

usuarioCtrl.loginUsuario = async (req, res) => {
    try {
        const { email, contraseña } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario || !usuario.contraseña) {
            return res.json({ status: '0', msg: "Email o contraseña incorrectos." });
        }
        
        if (!usuario.confirmado) {
            return res.json({ status: '0', msg: 'Debes confirmar tu email para poder iniciar sesión.' });
        }
        
        if ((usuario.rol === 'organizador' || usuario.rol === 'administrador') && usuario.estadoAprobacion !== 'aprobado') {
             return res.json({ status: '0', msg: `Tu cuenta con rol '${usuario.rol}' está ${usuario.estadoAprobacion}. Contacta a un administrador.` });
        }

        if (!usuario.estado) {
            return res.json({ status: '0', msg: "Tu cuenta ha sido desactivada." });
        }

        if (!await bcrypt.compare(contraseña, usuario.contraseña)) {
            return res.json({ status: '0', msg: "Email o contraseña incorrectos." });
        }
        
        const token = jwt.sign({ id: usuario._id }, "secretkey", { expiresIn: '24h' });
        res.json({ status: '1', msg: 'Login exitoso.', token, userId: usuario._id, rol: usuario.rol });

    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en el servidor.', error: error.message });
    }
};

usuarioCtrl.googleSignIn = async (req, res) => {
    try {
        const { email, name, sub } = req.body;
        let usuario = await Usuario.findOne({ email });

        if (usuario) {
            if (!usuario.googleId) {
                return res.status(400).json({ msg: 'Este email ya está registrado con contraseña. Por favor, inicia sesión con tu email y contraseña.' });
            }
        } else {
            const [nombre, ...apellidoArray] = name.split(' ');
            usuario = new Usuario({
                nombre,
                apellido: apellidoArray.join(' '),
                email,
                googleId: sub,
                rol: 'usuario',
                confirmado: true,
                estadoAprobacion: 'aprobado'
            });
            await usuario.save();
        }
        
        const token = jwt.sign({ id: usuario._id }, "secretkey", { expiresIn: '24h' });

        res.json({
            status: '1', 
            msg: 'Login con Google exitoso.', 
            token, 
            userId: usuario._id, 
            email: usuario.email,
            rol: usuario.rol
        });

    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en la autenticación con Google.', error: error.message });
    }
};

usuarioCtrl.confirmarEmail = async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ tokenConfirmacion: req.params.token });
        if (!usuario) {
            return res.status(404).json({ msg: 'Token no válido o expirado.' });
        }

        usuario.confirmado = true;
        usuario.tokenConfirmacion = null;
        await usuario.save();

        let msg = '¡Tu correo ha sido confirmado exitosamente!';
        
        if (usuario.rol === 'organizador' && usuario.estadoAprobacion === 'pendiente') {
            msg += ' Tu solicitud para ser organizador está pendiente de revisión por un administrador.';
        }
        
        res.json({ msg });

    } catch (error) {
        res.status(500).json({ msg: 'Error al confirmar la cuenta.', error: error.message });
    }
};

usuarioCtrl.aprobarRol = async (req, res) => {
    try {
        const usuarioAprobar = await Usuario.findById(req.params.id);
        if (!usuarioAprobar) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        
        usuarioAprobar.estadoAprobacion = 'aprobado';
        await usuarioAprobar.save();

        await emailService.enviarCorreoEstadoSolicitud(usuarioAprobar.email, usuarioAprobar.nombre, 'aprobado');
        
        res.json({ msg: `El rol de '${usuarioAprobar.nombre}' ha sido aprobado correctamente.` });
    } catch (error) {
        res.status(400).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};

usuarioCtrl.getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-contraseña');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo los usuarios.' });
    }
};

usuarioCtrl.getUsuarioById = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-contraseña -googleId');
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado.' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo el usuario.' });
    }
};

usuarioCtrl.deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const userToDelete = await Usuario.findById(id);

        if (!userToDelete) {
            return res.status(404).json({ 'status': '0', 'msg': 'Usuario no encontrado.' });
        }
        if (userToDelete.email === SUPER_ADMIN_EMAIL) {
            return res.status(403).json({ 'status': '0', 'msg': 'Acción no permitida. El administrador principal no puede ser desactivado.' });
        }

        await emailService.enviarCorreoCuentaDesactivada(userToDelete.email, userToDelete.nombre);

        userToDelete.estado = false;
        await userToDelete.save();
        
        res.json({ 'status': '1', 'msg': 'Usuario desactivado y notificado correctamente.' });
    } catch (error) {
        res.status(400).json({ 'status': '0', 'msg': 'Error procesando la operación.' });
    }
};

usuarioCtrl.updateUsuario = async (req, res) => {
    try {
        const userIdToModify = req.params.id;
        const userBeforeUpdate = await Usuario.findById(userIdToModify);

        if (!userBeforeUpdate) {
            return res.status(404).json({ msg: 'Usuario a modificar no encontrado.' });
        }
        
        const requester = await Usuario.findById(req.userId);
        if (userBeforeUpdate.email === SUPER_ADMIN_EMAIL && req.userId !== userIdToModify) {
             return res.status(403).json({ msg: 'Acción no permitida. No puedes modificar al administrador principal.' });
        }

        if (requester.rol !== 'administrador' && req.userId !== userIdToModify) {
            return res.status(403).json({ msg: 'Acceso denegado.' });
        }
        
        if (requester.rol !== 'administrador' && req.body.rol) {
            delete req.body.rol;
        }

        const updatedUser = await Usuario.findByIdAndUpdate(userIdToModify, req.body, { new: true });

        if (req.body.rol && userBeforeUpdate.rol !== updatedUser.rol) {
            await emailService.enviarCorreoCambioRol(updatedUser.email, updatedUser.nombre, updatedUser.rol);
        }
        if (req.body.estadoAprobacion === 'rechazado' && userBeforeUpdate.estadoAprobacion !== 'rechazado') {
             await emailService.enviarCorreoEstadoSolicitud(updatedUser.email, updatedUser.nombre, 'rechazado');
        }
        if (req.body.estado === false && userBeforeUpdate.estado === true) {
             await emailService.enviarCorreoCuentaDesactivada(updatedUser.email, updatedUser.nombre);
        }

        res.json({ msg: 'Usuario actualizado correctamente.', usuario: updatedUser });

    } catch (error) {
        res.status(400).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};

usuarioCtrl.cambiarContrasena = async (req, res) => {
    try {
        const userIdFromToken = req.userId;
        const userIdFromParams = req.params.id;
        const { contrasenaActual, nuevaContrasena } = req.body;

        if (userIdFromToken !== userIdFromParams) {
            return res.status(403).json({ msg: 'Acceso denegado.' });
        }
        
        const usuario = await Usuario.findById(userIdFromToken);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        if (!usuario.contraseña) {
            return res.status(400).json({ msg: 'Los usuarios de Google no pueden cambiar su contraseña de esta forma.' });
        }

        const esMatch = await bcrypt.compare(contrasenaActual, usuario.contraseña);
        if (!esMatch) {
            return res.status(400).json({ msg: 'La contraseña actual es incorrecta.' });
        }

        usuario.contraseña = await bcrypt.hash(nuevaContrasena, 10);
        await usuario.save();

        await emailService.enviarCorreoCambioContrasena(usuario.email, usuario.nombre);

        res.json({ msg: 'Contraseña actualizada con éxito.' });

    } catch (error) {
        res.status(500).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};

module.exports = usuarioCtrl;
