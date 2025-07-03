const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const authCtrl = {};
authCtrl.verifyToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ 'status': '0', 'msg': 'Petición no autorizada.' });
    }

    const arrayTexto = req.headers.authorization.split(' ');
    const token = (arrayTexto.length >= 2) ? arrayTexto[1] : null;

    if (token == null) {
        return res.status(401).json({ 'status': '0', 'msg': 'Petición no autorizada.' });
    }

    try {
        const payload = jwt.verify(token, "secretkey");
        req.userId = payload.id;
        next();
    } catch (error) {
        res.status(401).json({ 'status': '0', 'msg': 'Token inválido o expirado.' });
    }
};

authCtrl.esAdministrador = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.userId);

        if (!usuario) {
            return res.status(404).json({ 'status': '0', 'msg': 'Usuario no encontrado.' });
        }
        if (usuario.rol === 'administrador') {
            next();
        } else {
            return res.status(403).json({ 'status': '0', 'msg': 'Acceso denegado. Se requiere rol de administrador.' });
        }
    } catch (error) {
        return res.status(500).json({ 'status': '0', 'msg': 'Error del servidor al verificar el rol.' });
    }
};

module.exports = authCtrl;
