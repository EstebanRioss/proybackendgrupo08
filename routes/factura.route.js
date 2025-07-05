const express = require('express');
const router = express.Router();
const facturaCtrl = require('../controllers/factura.controller');
const authCtrl = require('../controllers/auth-controller');

// [POST] /api/facturas - Crear una nueva factura (requiere autenticación)
router.post('/', authCtrl.verifyToken, facturaCtrl.createFactura);

// [GET] /api/facturas - Obtener todas las facturas (solo para administradores)
router.get('/', [authCtrl.verifyToken, authCtrl.esAdministrador], facturaCtrl.getFacturas);

// [GET] /api/facturas/mis-facturas - Obtener las facturas del usuario logueado
router.get('/mis-facturas', authCtrl.verifyToken, facturaCtrl.getMisFacturas);

// [GET] /api/facturas/:id - Obtener una factura por su ID (dueño o admin)
router.get('/:id', authCtrl.verifyToken, facturaCtrl.getFacturaById);

// [PUT] /api/facturas/:id - Actualizar una factura (solo para administradores)
router.put('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], facturaCtrl.updateFactura);

// [DELETE] /api/facturas/:id - Eliminar una factura (solo para administradores)
router.delete('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], facturaCtrl.deleteFactura);

module.exports = router;

