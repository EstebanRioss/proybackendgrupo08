const express = require('express');
const router = express.Router();
const categoriaCtrl = require('../controllers/categoriaEvento.controller');
const authCtrl = require('../controllers/auth-controller');

router.get('/', categoriaCtrl.obtenerCategorias);
router.get('/:id', categoriaCtrl.obtenerCategoriaPorId);


router.post('/',[authCtrl.verifyToken, authCtrl.esAdministrador], categoriaCtrl.crearCategoria);
router.put('/:id',[authCtrl.verifyToken, authCtrl.esAdministrador], categoriaCtrl.actualizarCategoria);
router.delete('/:id',[authCtrl.verifyToken, authCtrl.esAdministrador], categoriaCtrl.eliminarCategoria);

module.exports = router;