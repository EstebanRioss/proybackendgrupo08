const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const usuarioCtrl = {};

// --- 1. REGISTRO CON FORMULARIO ---
usuarioCtrl.createUsuario = async (req, res) => {
    try {
        // CORRECCIÓN: Se espera "contraseña" (con ñ)
        const { nombre, apellido, email, contraseña, rol } = req.body;

        const existeUsuario = await Usuario.findOne({ email });
        if (existeUsuario) {
            if (existeUsuario.googleId) {
                return res.status(400).json({ msg: 'Este email ya fue registrado con Google. Por favor, inicia sesión con Google.' });
            }
            return res.status(400).json({ msg: 'El email ya está en uso.' });
        }

        const nuevoUsuario = new Usuario({ nombre, apellido, email, contraseña });
        
        const salt = await bcrypt.genSalt(10);
        nuevoUsuario.contraseña = await bcrypt.hash(contraseña, salt);

        if (rol) nuevoUsuario.rol = rol;
        await nuevoUsuario.save();
        res.status(201).json({ msg: 'Usuario registrado exitosamente.' });

    } catch (error) {
        res.status(400).json({ msg: 'Error al registrar el usuario.', error: error.message });
    }
};

// --- 2. LOGIN CON FORMULARIO ---
usuarioCtrl.loginUsuario = async (req, res) => {
    try {
        // CORRECCIÓN: Se espera "contraseña" (con ñ)
        const { email, contraseña } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario || !usuario.contraseña) {
            if (usuario && usuario.googleId) {
                return res.json({ status: '0', msg: "Esta cuenta fue creada con Google. Por favor, usa el botón de 'Iniciar sesión con Google'." });
            }
            return res.json({ status: '0', msg: "Email o contraseña incorrectos." });
        }
        
        const match = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!match) {
            return res.json({ status: '0', msg: "Email o contraseña incorrectos." });
        }
        
        if (!usuario.estado) {
            return res.json({ status: '0', msg: "Tu cuenta está desactivada." });
        }

        const token = jwt.sign({ id: usuario._id }, "secretkey", { expiresIn: 60 * 60 * 24 });

        res.json({
            status: '1', msg: 'Login exitoso.', userId: usuario._id, email: usuario.email,
            rol: usuario.rol, token: token
        });

    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en el servidor.', error: error.message });
    }
};

// --- 3. LOGIN / REGISTRO CON GOOGLE ---
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
            });
            await usuario.save();
        }
        
        const token = jwt.sign({ id: usuario._id }, "secretkey", { expiresIn: 60 * 60 * 24 });

        res.json({
            status: '1', msg: 'Login con Google exitoso.', userId: usuario._id, email: usuario.email,
            rol: usuario.rol, token: token
        });

    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en la autenticación con Google.', error: error.message });
    }
};

// --- 4. OTRAS FUNCIONES CRUD ---
usuarioCtrl.getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-contraseña -googleId');
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
