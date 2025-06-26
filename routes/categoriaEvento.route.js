const express = require('express');
const router = express.Router();
const categoriaCtrl = require('../controllers/categoriaEvento.controller');

router.get('/', categoriaCtrl.obtenerCategorias);
router.get('/:id', categoriaCtrl.obtenerCategoriaPorId);
router.post('/', categoriaCtrl.crearCategoria);
router.put('/:id', categoriaCtrl.actualizarCategoria);
router.delete('/:id', categoriaCtrl.eliminarCategoria);

module.exports = router;