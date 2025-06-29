const Usuario = require('../models/usuario');
const usuarioCtrl = {};
const jwt = require('jsonwebtoken');


usuarioCtrl.createUsuario = async (req, res) => {
    try {
        const usuario = new Usuario(req.body);
        await usuario.save();
        res.status(201).json({ msg: 'Usuario guardado exitosamente.', usuario });
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
        const usuario = await Usuario.findById(req.params.id).select('-contraseña');
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado.' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo el usuario.' });
    }
};

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

usuarioCtrl.updateUsuario = async (req, res) => {
    try {
        const userIdToModify = req.params.id;
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

        const usuario = await Usuario.findByIdAndUpdate(userIdToModify, req.body, { new: true });
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario a modificar no encontrado.' });
        }

        res.json({ msg: 'Usuario actualizado correctamente.', usuario });

    } catch (error) {
        res.status(400).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};


usuarioCtrl.loginUsuario = async (req, res) => {
    try {
        const { email, contraseña } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.json({ status: '0', msg: "El email no está registrado." });
        }

        if (usuario.contraseña !== contraseña) {
            return res.json({ status: '0', msg: "Contraseña incorrecta." });
        }

        if (!usuario.estado) {
            return res.json({ status: '0', msg: "Tu cuenta está desactivada. Contacta al administrador." });
        }

        const token = jwt.sign({ id: usuario._id }, "secretkey", {
            expiresIn: 60 * 60 * 24
        });

        res.json({
            status: '1',
            msg: 'Login exitoso.',
            userId: usuario._id,
            email: usuario.email,
            rol: usuario.rol,
            token: token
        });

    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en el servidor.', error: error.message });
    }
};

module.exports = usuarioCtrl;
