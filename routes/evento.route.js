const express = require('express');
const router = express.Router();
const eventoCtrl = require('../controllers/evento.controller');
const authCtrl = require('../controllers/auth-controller');

router.get('/', eventoCtrl.getEventos);
router.get('/proximos', eventoCtrl.getProximosEventos);
router.get('/nuevos', eventoCtrl.getNuevosEventos);
router.get('/:id', eventoCtrl.getEvento);
router.get('/eventos/organizador/:organizadorId', eventoCtrl.getEventosPorOrganizador);


router.post('/', authCtrl.verifyToken, eventoCtrl.createEvento);
router.put('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], eventoCtrl.editEvento);
router.delete('/:id', [authCtrl.verifyToken, authCtrl.esAdministrador], eventoCtrl.deleteEvento);

module.exports = router;