const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/email.service');

const usuarioCtrl = {};

usuarioCtrl.createUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, contraseña, rol } = req.body;
        if (await Usuario.findOne({ email })) {
            return res.status(400).json({ msg: 'El email ya está en uso.' });
        }
        
        const tokenConfirmacion = crypto.randomBytes(32).toString('hex');
        const nuevoUsuario = new Usuario({ ...req.body, tokenConfirmacion });

        // --- CAMBIO CLAVE ---
        // Ahora, tanto 'organizador' como 'administrador' necesitan aprobación.
        if (rol === 'organizador' || rol === 'administrador') {
            nuevoUsuario.estadoAprobacion = 'pendiente';
        }

        nuevoUsuario.contraseña = await bcrypt.hash(contraseña, 10);
        await nuevoUsuario.save();

        // El correo de confirmación se envía a todos
        await emailService.enviarCorreoConfirmacion(nuevoUsuario.email, tokenConfirmacion);

        // La notificación al admin se envía para ambos roles que requieren aprobación
        if (rol === 'organizador' || rol === 'administrador') {
            const admins = await Usuario.find({ rol: 'administrador' });
            admins.forEach(admin => {
                // Evita que el sistema se notifique a sí mismo si un admin se registra
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

// --- 2. LOGIN (LÓGICA DE ROLES CORREGIDA) ---
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
        
        // --- CAMBIO CLAVE ---
        // La validación de aprobación ahora aplica a ambos roles.
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

// --- 3. LOGIN / REGISTRO CON GOOGLE (FUNCIÓN AÑADIDA) ---
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
                confirmado: true // Las cuentas de Google se confirman automáticamente
            });
            await usuario.save();
        }
        
        const token = jwt.sign({ id: usuario._id }, "secretkey", { expiresIn: '24h' });

        res.json({
            status: '1', msg: 'Login con Google exitoso.', userId: usuario._id, email: usuario.email,
            rol: usuario.rol, token: token
        });

    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en la autenticación con Google.', error: error.message });
    }
};

// --- 4. CONFIRMAR EMAIL ---
usuarioCtrl.confirmarEmail = async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ tokenConfirmacion: req.params.token });
        if (!usuario) return res.status(404).json({ msg: 'Token no válido o expirado.' });

        usuario.confirmado = true;
        usuario.tokenConfirmacion = null;
        await usuario.save();

        let msg = '¡Cuenta confirmada exitosamente!';
        if (usuario.rol === 'organizador') msg += ' Tu solicitud será revisada por un administrador.';
        
        res.json({ msg });

    } catch (error) {
        res.status(500).json({ msg: 'Error al confirmar la cuenta.', error: error.message });
    }
};

// --- 5. APROBAR ORGANIZADOR (PARA ADMINS) ---
usuarioCtrl.aprobarRol = async (req, res) => {
    try {
        const usuarioAprobar = await Usuario.findById(req.params.id);
        if (!usuarioAprobar) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        
        if (usuarioAprobar.rol === 'usuario') {
            return res.status(400).json({ msg: 'Los usuarios normales no requieren aprobación.' });
        }

        usuarioAprobar.estadoAprobacion = 'aprobado';
        await usuarioAprobar.save();
        // Opcional: Enviar un email al usuario notificándole que su cuenta fue aprobada.
        res.json({ msg: `El usuario con rol '${usuarioAprobar.rol}' ha sido aprobado correctamente.` });
    } catch (error) {
        res.status(400).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};

// --- 6. OBTENER TODOS LOS USUARIOS (FUNCIÓN AÑADIDA) ---
usuarioCtrl.getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-contraseña -googleId');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo los usuarios.' });
    }
};

// --- 7. OBTENER USUARIO POR ID (FUNCIÓN AÑADIDA) ---
usuarioCtrl.getUsuarioById = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-contraseña -googleId');
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado.' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo el usuario.' });
    }
};

// --- 8. DESACTIVAR USUARIO (FUNCIÓN AÑADIDA) ---
usuarioCtrl.deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioDesactivado = await Usuario.findByIdAndUpdate(id, { estado: false }, { new: true });
        if (!usuarioDesactivado) {
            return res.status(404).json({ 'status': '0', 'msg': 'Usuario no encontrado.' });
        }
        res.json({ 'status': '1', 'msg': 'Usuario desactivado correctamente.' });
    } catch (error) {
        res.status(400).json({ 'status': '0', 'msg': 'Error procesando la operación.' });
    }
};

// --- 9. ACTUALIZAR USUARIO (FUNCIÓN AÑADIDA) ---
usuarioCtrl.updateUsuario = async (req, res) => {
    try {
        const userIdToModify = req.params.id;
        // La ID del solicitante viene del token verificado por el middleware
        const requesterId = req.userId; 
        const requester = await Usuario.findById(requesterId);

        if (!requester) {
            return res.status(404).json({ msg: 'Usuario solicitante no encontrado.' });
        }
        if (requester.rol !== 'administrador' && requesterId !== userIdToModify) {
            return res.status(403).json({ msg: 'Acceso denegado. No tienes permiso para actualizar este usuario.' });
        }
        if (requester.rol !== 'administrador' && req.body.rol) {
            delete req.body.rol;
        }

        delete req.body.contraseña;
        delete req.body.googleId;

        const usuario = await Usuario.findByIdAndUpdate(userIdToModify, req.body, { new: true }).select('-contraseña -googleId');
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario a modificar no encontrado.' });
        }
        res.json({ msg: 'Usuario actualizado correctamente.', usuario });
    } catch (error) {
        res.status(400).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};

module.exports = usuarioCtrl;
