const CategoriaEvento = require('../models/categoriaEvento');
const categoriaCtrl = {};

// Crear nueva categoría
categoriaCtrl.crearCategoria = async (req, res) => {
    try {
        const nuevaCategoria = new CategoriaEvento(req.body);
        const categoriaGuardada = await nuevaCategoria.save();
        res.json({
        status: '1',
        msg: 'categoria guardado.'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener todas las categorías
categoriaCtrl.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await CategoriaEvento.find();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener categoría por ID
categoriaCtrl.obtenerCategoriaPorId = async (req, res) => {
    try {
        const categoria = await CategoriaEvento.findById(req.params.id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.status(200).json(categoria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar categoría
categoriaCtrl.actualizarCategoria = async (req, res) => {
    try {
        const categoriaActualizada = await CategoriaEvento.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!categoriaActualizada) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({
        status: '1',
        msg: 'Evento actualizado.'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar categoría
categoriaCtrl.eliminarCategoria = async (req, res) => {
    try {
        const categoria = await CategoriaEvento.findByIdAndDelete(req.params.id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.status(200).json({ mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = categoriaCtrl;