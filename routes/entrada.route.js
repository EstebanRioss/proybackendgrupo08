const express = require('express');
const router = express.Router();
const entradaCtrl = require('../controllers/entrada.controller');
const authCtrl = require('../controllers/auth-controller');

// [POST] /api/entradas - Crear una nueva entrada (requiere que el usuario esté autenticado)
router.post('/', authCtrl.verifyToken, entradaCtrl.createEntrada);

// [GET] /api/entradas - Obtener todas las entradas (solo para administradores)
router.get('/', [authCtrl.verifyToken, authCtrl.esAdministrador], entradaCtrl.getEntradas);

// [GET] /api/entradas/mis-entradas - Obtener las entradas del usuario logueado
router.get('/mis-entradas', authCtrl.verifyToken, entradaCtrl.getMisEntradas);

// [GET] /api/entradas/:id - Obtener una entrada por su ID (requiere autenticación)
// La lógica para verificar si el usuario es el dueño o un admin debe ir en el controlador.
router.get('/:id', authCtrl.verifyToken, entradaCtrl.getEntradaById);

// [PUT] /api/entradas/:id - Actualizar una entrada por su ID (solo para administradores)
router.put('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], entradaCtrl.updateEntrada);

// [DELETE] /api/entradas/:id - Eliminar una entrada por su ID (solo para administradores)
router.delete('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], entradaCtrl.deleteEntrada);

module.exports = router;
