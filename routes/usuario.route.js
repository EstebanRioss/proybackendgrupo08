const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuario.controller');
const authCtrl = require('../controllers/auth-controller');

// --- RUTAS PÚBLICAS ---
router.post('/', usuarioCtrl.createUsuario);
router.post('/login', usuarioCtrl.loginUsuario);

// --- RUTAS PROTEGIDAS ---

// Solo el admin puede ver TODOS los usuarios y ELIMINARLOS
router.get('/', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.getUsuarios);
router.delete('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.deleteUsuario);


// Un usuario puede ver perfiles (suyo o de otros)
router.get('/:id', authCtrl.verifyToken, usuarioCtrl.getUsuarioById);

// ¡MODIFICADO! Esta ruta ahora solo verifica que haya un token.
// La lógica de permisos para actualizar está dentro del controlador.
router.put('/:id', authCtrl.verifyToken, usuarioCtrl.updateUsuario);


module.exports = router;
