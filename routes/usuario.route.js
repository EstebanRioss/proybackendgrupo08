const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuario.controller');
const authCtrl = require('../controllers/auth-controller');

// --- RUTAS PÚBLICAS ---
router.post('/', usuarioCtrl.createUsuario);
router.post('/login', usuarioCtrl.loginUsuario);
router.post('/google-signin', usuarioCtrl.googleSignIn);
router.get('/confirmar/:token', usuarioCtrl.confirmarEmail);

// --- RUTAS PROTEGIDAS ---

// --- CAMBIO CLAVE ---
// La ruta ahora es más genérica y llama a la nueva función del controlador.
router.put('/aprobar-rol/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.aprobarRol);

router.get('/', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.getUsuarios);
router.delete('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.deleteUsuario);
router.get('/:id', authCtrl.verifyToken, usuarioCtrl.getUsuarioById);
router.put('/:id', authCtrl.verifyToken, usuarioCtrl.updateUsuario);

module.exports = router;
