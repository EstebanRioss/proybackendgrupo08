const Evento = require('../models/evento');
const eventoCtrl = {};

// Obtener todos los eventos
eventoCtrl.getEventos = async (req, res) => {
  try {
        const eventos = await Evento.find();
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener los eventos.', error: error.message });
    }
};

eventoCtrl.getEventosPorOrganizador = async (req, res) => {
  try {
    const { organizadorId } = req.params;  // Lo recibís por parámetro de la ruta

    if (!organizadorId) {
      return res.status(400).json({ msg: 'Falta el ID del organizador' });
    }

    // Buscar eventos cuyo organizadorId coincida con el recibido
    const eventos = await Evento.find({ organizadorId: organizadorId });

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener los eventos.', error: error.message });
  }
};

// Obtener un evento por ID
eventoCtrl.getEvento = async (req, res) => {
  try {
      const evento = await Evento.findById(req.params.id);
      if (!evento) return res.status(404).json({ msg: 'Evento no encontrado.' });
      res.json(evento);
    } catch (error) {
      res.status(500).json({ msg: 'Error al obtener el evento.', error: error.message });
    }
};

// Crear un nuevo evento
eventoCtrl.createEvento = async (req, res) => {
  const evento = new Evento(req.body);
  try {
        const { userId, userRol } = req;
        if (userRol !== 'organizador' && userRol !== 'administrador') {
            return res.status(403).json({ msg: 'No tienes permiso para crear eventos.' });
        }

        const nuevoEvento = new Evento({ ...req.body, organizadorId: userId });
        await nuevoEvento.save();
        res.status(201).json({ msg: 'Evento creado correctamente.', evento: nuevoEvento });
  } catch (error) {
        res.status(400).json({ msg: 'Error al crear el evento.', error: error.message });
      }
};

// Editar un evento existente
eventoCtrl.editEvento = async (req, res) => {
  try {
        const evento = await Evento.findById(req.params.id);
        const { userId, userRol } = req;

        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado.' });
        if (evento.organizadorId.toString() !== userId && userRol !== 'administrador') {
            return res.status(403).json({ msg: 'No tienes permiso para editar este evento.' });
        }

        Object.assign(evento, req.body);
        await evento.save();
        res.json({ msg: 'Evento actualizado correctamente.', evento });
    } catch (error) {
        res.status(400).json({ msg: 'Error al actualizar el evento.', error: error.message });
    }
};

// Eliminar un evento
eventoCtrl.deleteEvento = async (req, res) => {
   try {
        const evento = await Evento.findById(req.params.id);
        const { userId, userRol } = req;

        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado.' });
        if (evento.creador.toString() !== userId && userRol !== 'administrador') {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar este evento.' });
        }

        await evento.remove();
        res.json({ msg: 'Evento eliminado correctamente.' });
    } catch (error) {
        res.status(400).json({ msg: 'Error al eliminar el evento.', error: error.message });
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