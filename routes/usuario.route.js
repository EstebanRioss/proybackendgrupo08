const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuario.controller');

router.post('/', usuarioCtrl.createUsuario);
router.get('/', usuarioCtrl.getUsuarios);
router.get('/:id', usuarioCtrl.getUsuarioById);
router.put('/:id', usuarioCtrl.updateUsuario);
router.delete('/:id', usuarioCtrl.deleteUsuario);

router.post('/login', usuarioCtrl.loginUsuario);

module.exports = router;