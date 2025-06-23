const Usuario = require('../models/usuario');
const usuarioCtrl = {};

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

usuarioCtrl.updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByIdAndUpdate(id, req.body, { new: true });
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado.' });
        res.json({ msg: 'Usuario actualizado correctamente.', usuario });
    } catch (error) {
        res.status(400).json({ msg: 'Error procesando la operación.', error: error.message });
    }
};

usuarioCtrl.deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuarioDesactivado = await Usuario.findByIdAndUpdate(id, { estado: false }, { new: true });
        
        if (!usuarioDesactivado) {
            return res.status(404).json({
                'status': '0',
                'msg': 'Usuario no encontrado.'
            });
        }
        
        res.json({
            'status': '1',
            'msg': 'Usuario desactivado correctamente.'
        });
    } catch (error) {
        res.status(400).json({
            'status': '0',
            'msg': 'Error procesando la operación.'
        });
    }
};
usuarioCtrl.loginUsuario = async (req, res) => {
    try {
        const { email, contraseña } = req.body;
        const usuario = await Usuario.findOne({ email });
        
        if (!usuario) {
            return res.status(404).json({ msg: "El email no está registrado." });
        }

        if (usuario.contraseña !== contraseña) {
            return res.status(400).json({ msg: "Contraseña incorrecta." });
        }
        
        if (!usuario.estado) {
            return res.status(403).json({ msg: "Tu cuenta está desactivada. Contacta al administrador." });
        }
        
        const usuarioSinPass = usuario.toObject();
        delete usuarioSinPass.contraseña;
        res.json({ msg: 'Login exitoso.', usuario: usuarioSinPass });

    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

module.exports = usuarioCtrl;