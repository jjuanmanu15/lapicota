const express = require('express');
const router = express.Router();
const presosController = require('../controllers/presosController');
const validatePreso = require('../middlewares/validatePreso');

// GET con filtros (TODO en uno solo)
router.get('/', presosController.getAllPresos);

// GET por Cédula
router.get('/cedula/:numero_documento', presosController.getPresoByCedula);

// GET por ID
router.get('/:id', presosController.getPresoById);

// POST
router.post('/', validatePreso, presosController.createPreso);

// PUT
router.put('/:id', validatePreso, presosController.updatePreso);

module.exports = router;