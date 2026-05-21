const guardiasService = require('../services/guardiasService');

async function createGuardia(req, res) {

    try {

        const guardia = await guardiasService.createGuardias(req.body);

        res.status(201).json({ message: 'Guardia creada correctamente', guardia });

    } catch (error) {

        if (error.message && error.message.toLowerCase().includes('ya existe')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });

    }

}

async function getGuardias(req, res) {

    try {
        const guardias = await guardiasService.getGuardias();

        res.json(guardias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las guardias' });
    }

}

async function getGuardiaById(req, res) {

    try {

        const id = req.params.id;
        if (isNaN(id)) {
            return res.status(400).json({ error: 'El ID debe ser un número válido' });
        }
        const guardia = await guardiasService.getGuardiasById(id);

        res.json(guardia);

    } catch (error) {

        if (error.message && error.message.toLowerCase().includes('no existe')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al obtener la guardia' });

    }

}

async function getGuardiaByCedula(req, res) {

    try {

        const numero_documento = req.params.numero_documento;

        const cedulaRegex = /^\d+$/;
        if (!cedulaRegex.test(numero_documento)) {
            return res.status(400).json({ error: 'numero_documento debe contener solo dígitos' });
        }

        const guardia = await guardiasService.getGuardiaByCedula(numero_documento);

        res.json(guardia);

    } catch (error) {

        if (error.message && error.message.toLowerCase().includes('no existe')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al obtener la guardia por cédula' });

    }

}

async function updateGuardia(req, res) {

    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.status(400).json({ error: 'El ID debe ser un número válido' });
        }
        const guardia = await guardiasService.updateGuardias(id, req.body);

        res.json({ message: 'Guardia actualizada correctamente', guardia });

    } catch (error) {

        if (error.message && error.message.toLowerCase().includes('no existe')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });

    }

}

module.exports = {
    createGuardia,
    getGuardias,
    getGuardiaById,
    getGuardiaByCedula,
    updateGuardia
};