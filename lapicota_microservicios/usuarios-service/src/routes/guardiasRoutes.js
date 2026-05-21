const express = require('express');
const router = express.Router()
const guardiasController = require('../controllers/guardiasController');
const validateGuardia = require('../middlewares/validateGuardia');

router.post('/', validateGuardia, guardiasController.createGuardia);

router.get('/', guardiasController.getGuardias);

router.get('/cedula/:numero_documento', guardiasController.getGuardiaByCedula);

router.get('/:id', guardiasController.getGuardiaById);

router.put('/:id', validateGuardia, guardiasController.updateGuardia);

module.exports = router;