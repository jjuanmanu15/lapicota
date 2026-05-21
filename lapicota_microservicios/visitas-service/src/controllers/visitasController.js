const { Router } = require('express');
const router = Router();
const visitasModel = require('../models/visitasModel');
const {
    validarCreacionVisita,
    validarCambioEstadoVisita
} = require('../middlewares/validateVisita');



// GET TODAS LAS VISITAS
router.get('/api/visitas', async (req, res) => {
    try {

        const visitas = await visitasModel.obtenerVisitas();
        res.status(200).json(visitas);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener visitas'
        });
    }
});


// GET VISITA POR ID
router.get('/api/visitas/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const visita = await visitasModel.obtenerVisitaPorId(id);

        if (!visita) {
            return res.status(404).json({
                error: 'Visita no encontrada'
            });
        }

        res.json(visita);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener visita'
        });
    }

});


// GET VISITAS POR PRESO
router.get('/api/visitas/preso/:preso_id', async (req, res) => {

    try {

        const { preso_id } = req.params;

        const visitas = await visitasModel.obtenerVisitasPorPreso(preso_id);

        res.json(visitas);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener visitas del preso'
        });

    }

});


//CREAR VISITA
router.post('/api/visitas', validarCreacionVisita, async (req, res) => {
    try {
        const {
            nombre_visitante,
            documento_visitante,
            preso_id,
            fecha_visita,
            hora_visita,
            estado_visita,
            motivo_denegacion
        } = req.body;

        const preso = req.preso;

        const visitaDuplicada = await visitasModel.obtenerVisitaDuplicada(
            nombre_visitante,
            documento_visitante,
            preso_id,
            fecha_visita,
            hora_visita
        );

        if (visitaDuplicada) {
            return res.status(409).json({
                error: 'Ya existe una visita registrada con los mismos datos'
            });
        }

        const result = await visitasModel.crearVisita(
            nombre_visitante,
            documento_visitante,
            preso_id,
            fecha_visita,
            hora_visita,
            estado_visita,
            motivo_denegacion
        );

        res.status(201).json({
            mensaje: 'Visita registrada',
            visita_id: result.insertId,
            preso: `${preso.nombres} ${preso.apellidos}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al crear visita'
        });
    }
});

// CAMBIAR ESTADO
router.put('/api/visitas/:id/estado', validarCambioEstadoVisita, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_visita, motivo_denegacion } = req.body;

        const visita = await visitasModel.obtenerVisitaPorId(id);

        if (!visita) {
            return res.status(404).json({
                error: 'Visita no encontrada'
            });
        }

        await visitasModel.cambiarEstadoVisita(
            id,
            estado_visita,
            motivo_denegacion
        );

        res.json({
            mensaje: 'Estado actualizado'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al actualizar estado'
        });
    }
});

module.exports = router;