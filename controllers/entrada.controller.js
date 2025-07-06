const Entrada = require('../models/entrada.js');
const entradaCtrl = {};

entradaCtrl.createEntrada = async (req, res) => {
    try {
        // El ID del usuario se obtiene del token, no del body, por seguridad.
        const usuarioId = req.userId;
        const { nombre, precio, tipo, facturaId, eventoId } = req.body;

        const nuevaEntrada = new Entrada({
            nombre,
            precio,
            tipo,
            estado: 'vendida', // Se asume que al crearla, ya está vendida.
            usuarioId, // Asociado al usuario autenticado.
            facturaId,
            eventoId
        });

        await nuevaEntrada.save();
        res.status(201).json({
            msg: 'Entrada creada exitosamente',
            entrada: nuevaEntrada
        });
    } catch (error) {
        res.status(400).json({ msg: 'Error al crear la entrada', error: error.message });
    }
};

entradaCtrl.crearEntradaDesdeWebhook = async ({ nombre, precio, tipo, facturaId, eventoId, usuarioId }) => {
    try {
        const nuevaEntrada = new Entrada({
            nombre,
            precio,
            tipo,
            estado: 'vendida',
            usuarioId,
            facturaId,
        });
        const entradaCreada = await nuevaEntrada.save();
        return entradaCreada;
    } catch (error) {
        console.error("Error al crear entrada desde webhook:", error.message);
        throw error;
    }
};

entradaCtrl.getEntradas = async (req, res) => {
    try {
        const entradas = await Entrada.find()
        res.status(200).json(entradas);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener las entradas', error: error.message });
    }
};

entradaCtrl.getEntradaById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, userRol } = req; // Datos del usuario autenticado.

        const entrada = await Entrada.findById(id)
            .populate('usuarioId', 'nombre email')
            .populate('facturaId')
            .populate('eventoId');

        if (!entrada) {
            return res.status(404).json({ msg: 'Entrada no encontrada' });
        }

        // Lógica de autorización: Solo el dueño o un admin pueden ver la entrada.
        if (userRol !== 'administrador' && entrada.usuarioId._id.toString() !== userId) {
            return res.status(403).json({ msg: 'Acceso denegado. No tienes permiso para ver esta entrada.' });
        }

        res.status(200).json(entrada);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener la entrada', error: error.message });
    }
};

entradaCtrl.updateEntrada = async (req, res) => {
    try {
        const { id } = req.params;
        const entrada = await Entrada.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!entrada) {
            return res.status(404).json({ msg: 'Entrada no encontrada' });
        }
        res.status(200).json({ msg: 'Entrada actualizada exitosamente', entrada });
    } catch (error) {
        res.status(400).json({ msg: 'Error al actualizar la entrada', error: error.message });
    }
};


entradaCtrl.deleteEntrada = async (req, res) => {
    try {
        const entrada = await Entrada.findByIdAndDelete(req.params.id);
        if (!entrada) {
            return res.status(404).json({ msg: 'Entrada no encontrada' });
        }
        res.status(200).json({ msg: 'Entrada eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la entrada', error: error.message });
    }
};


entradaCtrl.getMisEntradas = async (req, res) => {
    try {
        const usuarioId = req.userId; // ID del usuario autenticado
        const entradas = await Entrada.find({ usuarioId: usuarioId })
            .populate('eventoId', 'nombre fecha imagenUrl')
            .populate('facturaId', 'total');

        res.status(200).json(entradas);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener tus entradas', error: error.message });
    }
};

module.exports = entradaCtrl;
