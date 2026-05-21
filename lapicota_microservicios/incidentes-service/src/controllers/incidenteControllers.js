const incidentesService = require('../services/incidenteService');

async function createIncidente(req, res) {

    try {

        const incidente = await incidentesService.createIncidente(req.body);

        res.status(201).json(incidente);

    } catch (error) {

        const msg = error.message || '';
        if (msg.toLowerCase().includes('entidades relacionadas')) {
            return res.status(404).json({ error: msg });
        }
        if (msg.toLowerCase().includes('estado inválido')) {
            return res.status(400).json({ error: msg });
        }

        res.status(500).json({ error: msg });

    }

}

async function getIncidentes(req, res) {

    const incidentes = await incidentesService.getIncidentes();

    res.json(incidentes);

}

async function getIncidenteId(req, res) {

    try {

        const incidente = await incidentesService.getIncidenteId(req.params.id);

        res.json(incidente);

    } catch (error) {

        res.status(404).json({ error: error.message });

    }

}

async function incidentesPorPreso(req, res) {

    try {
        const incidentes = await incidentesService.getIncidentesPorPreso(req.params.preso_id);
        res.json(incidentes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener incidentes por preso' });
    }
}
async function updateIncidente(req, res) {
    try {

        const result = await incidentesService.updateIncidente(
            req.params.id,
            req.body
        );

        res.json(result);

    } catch (error) {

        const msg = error.message || '';

        if (msg.toLowerCase().includes('entidades relacionadas')) {
            return res.status(404).json({ error: msg });
        }

        if (msg.toLowerCase().includes('estado inválido')) {
            return res.status(400).json({ error: msg });
        }

        res.status(500).json({ error: msg });
    }
}

module.exports = {
    createIncidente,
    getIncidentes,
    getIncidenteId,
    incidentesPorPreso,
    updateIncidente
};