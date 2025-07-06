const Factura = require('../models/factura');
const Entrada = require('../models/entrada');
const mongoose = require('mongoose');
const facturaCtrl = {};

/**
 * Crea una nueva factura y sus entradas asociadas en una única transacción.
 * Espera un body con: { facturaData: {...}, entradas: [...] }
 */
facturaCtrl.createFactura = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const usuarioId = req.userId;
        const { facturaData, entradas } = req.body;

        if (!facturaData || !entradas || !Array.isArray(entradas) || entradas.length === 0) {
            throw new Error('Datos de factura o lista de entradas inválidos.');
        }

        // 1. Crear la factura
        const nuevaFactura = new Factura({
            ...facturaData,
            usuarioId: usuarioId
        });
        const facturaGuardada = await nuevaFactura.save({ session });

        // 2. Preparar las entradas para asociarlas a la nueva factura
        const entradasParaCrear = entradas.map(entrada => ({
            ...entrada,
            facturaId: facturaGuardada._id,
            usuarioId: usuarioId, // El dueño de la entrada es el mismo que el de la factura
            estado: 'vendida'
        }));

        // 3. Insertar todas las entradas en lote
        const entradasCreadas = await Entrada.insertMany(entradasParaCrear, { session });

        // 4. Si todo fue bien, confirmar la transacción
        await session.commitTransaction();

        res.status(201).json({
            msg: 'Factura creada exitosamente',
            factura: facturaGuardada,
            entradas: entradasCreadas
        });
    } catch (error) {
        // 5. Si algo falló, revertir todos los cambios
        await session.abortTransaction();
        res.status(400).json({ msg: 'Error al crear la factura', error: error.message });
    } finally {
        // 6. Cerrar la sesión
        session.endSession();
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
