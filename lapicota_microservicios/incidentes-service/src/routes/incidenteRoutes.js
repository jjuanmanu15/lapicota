const express = require('express');

const router = express.Router();

const incidentesController = require('../controllers/incidenteControllers');
const validateIncidente = require('../middlewares/validateIncidente');

router.post('/', validateIncidente, incidentesController.createIncidente);

router.get('/', incidentesController.getIncidentes);

router.get('/:id', incidentesController.getIncidenteId);

router.get('/preso/:preso_id', incidentesController.incidentesPorPreso);
router.put('/:id', incidentesController.updateIncidente);


module.exports = router;