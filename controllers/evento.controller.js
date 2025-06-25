const Evento = require('../models/evento');
const eventoCtrl = {};

// Obtener todos los eventos
eventoCtrl.getEventos = async (req, res) => {
  const eventos = await Evento.find();
  res.json(eventos);
};

// Obtener un evento por ID
eventoCtrl.getEvento = async (req, res) => {
  const evento = await Evento.findById(req.params.id);
  res.json(evento);
};

// Crear un nuevo evento
eventoCtrl.createEvento = async (req, res) => {
  const evento = new Evento(req.body);
  try {
    await evento.save();
    res.json({
      status: '1',
      msg: 'Evento guardado.'
    });
  } catch (error) {
    res.status(400).json({
      status: '0',
      msg: 'Error procesando operación.'
    });
  }
};

// Editar un evento existente
eventoCtrl.editEvento = async (req, res) => {
  const vEvento = new Evento(req.body);
  try {
    await Evento.updateOne({ _id: req.body._id }, vEvento);
    res.json({
      status: '1',
      msg: 'Evento actualizado.'
    });
  } catch (error) {
    res.status(400).json({
      status: '0',
      msg: 'Error procesando la operación.'
    });
  }
};

// Eliminar un evento
eventoCtrl.deleteEvento = async (req, res) => {
  try {
    await Evento.deleteOne({ _id: req.params.id });
    res.json({
      status: '1',
      msg: 'Evento eliminado.'
    });
  } catch (error) {
    res.status(400).json({
      status: '0',
      msg: 'Error procesando la operación.'
    });
  }
};

// Obtener 3 eventos más recientes (nuevos eventos)
eventoCtrl.getNuevosEventos = async (req, res) => {
  try {
    const eventos = await Evento.find()
      .sort({ createdAt: -1 })
      .limit(3);
    res.json(eventos);
  } catch (error) {
    console.error('Error en getNuevosEventos:', error);
    res.status(500).json({
      status: '0',
      msg: 'Error obteniendo nuevos eventos.'
    });
  }
};

// Obtener 3 próximos eventos
eventoCtrl.getProximosEventos = async (req, res) => {
  try {
    const now = new Date();
    const eventos = await Evento.find({ fecha: { $gte: now } })
      .sort({ fecha: 1 })
      .limit(3);
    res.json(eventos);
  } catch (error) {
    res.status(500).json({
      status: '0',
      msg: 'Error obteniendo próximos eventos.'
    });
  }
};

module.exports = eventoCtrl;