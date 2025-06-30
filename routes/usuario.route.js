const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuario.controller');
const authCtrl = require('../controllers/auth-controller');

// --- RUTAS PÚBLICAS ---
// Para registrar un nuevo usuario con el formulario
router.post('/', usuarioCtrl.createUsuario);

// Para iniciar sesión con email y contraseña
router.post('/login', usuarioCtrl.loginUsuario);

// Para registrarse o iniciar sesión con Google
router.post('/google-signin', usuarioCtrl.googleSignIn);


// --- RUTAS PROTEGIDAS (Requieren Token) ---

// Obtener todos los usuarios (solo administradores)
router.get('/', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.getUsuarios);

// Desactivar un usuario (solo administradores)
router.delete('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], usuarioCtrl.deleteUsuario);

// Obtener un usuario específico por su ID
router.get('/:id', authCtrl.verifyToken, usuarioCtrl.getUsuarioById);

// Actualizar un usuario (permisos manejados dentro del controlador)
router.put('/:id', authCtrl.verifyToken, usuarioCtrl.updateUsuario);


module.exports = router;