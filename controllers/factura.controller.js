const Factura = require('../models/factura');
const Entrada = require('../models/entrada');
const facturaCtrl = {};

// Crear una nueva factura
facturaCtrl.createFactura = async (req, res) => {
    try {
        const usuarioId = req.userId; // ID del usuario autenticado
        const nuevaFactura = new Factura({
            ...req.body,
            usuarioId: usuarioId
        });
        await nuevaFactura.save();
        res.status(201).json({
            msg: 'Factura creada exitosamente',
            factura: nuevaFactura
        });
    } catch (error) {
        res.status(400).json({ msg: 'Error al crear la factura', error: error.message });
    }
};

// Obtener todas las facturas (Solo para Administradores)
facturaCtrl.getFacturas = async (req, res) => {
    try {
        const facturas = await Factura.find().populate('usuarioId', 'nombre email');
        res.status(200).json(facturas);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener las facturas', error: error.message });
    }
};

// Obtener una factura por ID (Dueño o Administrador)
facturaCtrl.getFacturaById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, userRol } = req;

        const factura = await Factura.findById(id).populate('usuarioId', 'nombre email');

        if (!factura) {
            return res.status(404).json({ msg: 'Factura no encontrada' });
        }

        // Autorización: solo el dueño o un admin pueden verla
        if (userRol !== 'administrador' && factura.usuarioId._id.toString() !== userId) {
            return res.status(403).json({ msg: 'Acceso denegado. No tienes permiso para ver esta factura.' });
        }

        // Para cumplir la relación "Factura contiene Entradas", las buscamos
        const entradas = await Entrada.find({ facturaId: id }).populate('eventoId', 'nombre');

        res.status(200).json({ factura, entradas });

    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener la factura', error: error.message });
    }
};

// Obtener las facturas del usuario logueado
facturaCtrl.getMisFacturas = async (req, res) => {
    try {
        const usuarioId = req.userId;
        const facturas = await Factura.find({ usuarioId: usuarioId });
        res.status(200).json(facturas);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener tus facturas', error: error.message });
    }
};

// Actualizar una factura (Solo para Administradores)
facturaCtrl.updateFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioId, ...data } = req.body; // Evitar que se cambie el dueño

        const factura = await Factura.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        if (!factura) {
            return res.status(404).json({ msg: 'Factura no encontrada' });
        }
        res.status(200).json({ msg: 'Factura actualizada exitosamente', factura });
    } catch (error) {
        res.status(400).json({ msg: 'Error al actualizar la factura', error: error.message });
    }
};

// Eliminar una factura (Solo para Administradores)
facturaCtrl.deleteFactura = async (req, res) => {
    try {
        const factura = await Factura.findByIdAndDelete(req.params.id);
        if (!factura) {
            return res.status(404).json({ msg: 'Factura no encontrada' });
        }
        res.status(200).json({ msg: 'Factura eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la factura', error: error.message });
    }
};

module.exports = facturaCtrl;

