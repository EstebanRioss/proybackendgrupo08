const CategoriaEvento = require('../models/categoriaEvento');
const categoriaCtrl = {};

// Crear nueva categoría
categoriaCtrl.crearCategoria = async (req, res) => {
    try {
        const { userRol } = req;

        const nuevaCategoria = new CategoriaEvento(req.body);
        await nuevaCategoria.save();
        res.status(201).json({ msg: 'Categoría creada correctamente.', categoria: nuevaCategoria });
    } catch (error) {
        res.status(400).json({ msg: 'Error al crear la categoría.', error: error.message });
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
        const { userRol } = req;

        const categoria = await CategoriaEvento.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!categoria) return res.status(404).json({ msg: 'Categoría no encontrada.' });

        res.json({ msg: 'Categoría actualizada correctamente.', categoria });
    } catch (error) {
        res.status(400).json({ msg: 'Error al actualizar la categoría.', error: error.message });
    }
};

// Eliminar categoría
categoriaCtrl.eliminarCategoria = async (req, res) => {
    try {
        const { userRol } = req;

        const categoria = await CategoriaEvento.findByIdAndDelete(req.params.id);
        if (!categoria) return res.status(404).json({ msg: 'Categoría no encontrada.' });

        res.json({ msg: 'Categoría eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la categoría.', error: error.message });
    }
};

module.exports = categoriaCtrl;