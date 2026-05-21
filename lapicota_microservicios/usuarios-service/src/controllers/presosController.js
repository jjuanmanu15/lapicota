const presosService = require('../services/presosService');

async function getAllPresos(req, res) {
    try {
        const presos = await presosService.getPresos();
        res.json(presos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los presos' });
    }
}

async function getPresoById(req, res) {
    try {
        const id = req.params.id;
        const preso = await presosService.getPresoForId(id);
        res.json(preso);
    } catch (error) {
        if (error.message && error.message.toLowerCase().includes('no existe')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al obtener el preso' });
    }
}

async function getPresoByCedula(req, res) {
    try {
        const numero_documento = req.params.numero_documento;

        const cedulaRegex = /^\d+$/;
        if (!cedulaRegex.test(numero_documento)) {
            return res.status(400).json({ error: 'numero_documento debe contener solo dígitos' });
        }

        const preso = await presosService.getPresoByCedula(numero_documento);
        res.json(preso);
    } catch (error) {
        if (error.message && error.message.toLowerCase().includes('no existe')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al obtener el preso por cédula' });
    }
}

async function createPreso(req, res) {
    try {
        const preso = req.body;
        const result = await presosService.createPreso(preso);
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        res.json(result);
    } catch (error) {
        console.error(error);
        if (error.message && error.message.toLowerCase().includes('ya existe')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al crear el preso' });
    }
}

async function updatePreso(req, res) {
    try {
        const id = req.params.id;
        const preso = req.body;

        preso.id_preso = id;

        const result = await presosService.updatePreso(id, preso);

        res.json({ message: 'Dato actualizado correctamente', result });
    } catch (error) {
        console.error(error);
        if (error.message && error.message.toLowerCase().includes('no existe')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message && error.message.toLowerCase().includes('existe')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al actualizar el preso' });
    }
}




module.exports = {
    getAllPresos,
    getPresoById,
    getPresoByCedula,
    createPreso,
    updatePreso
};
