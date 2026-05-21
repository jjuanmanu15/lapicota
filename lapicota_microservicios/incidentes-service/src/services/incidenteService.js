const incidentesModel = require('../models/incidenteModel');
const axios = require('axios');

const USUARIOS_SERVICE = "http://localhost:3001";
const VISITAS_SERVICE = "http://localhost:3002/api";

async function createIncidente(data) {

    try {

        if (data.preso_id) {

            await axios.get(`${USUARIOS_SERVICE}/presos/${data.preso_id}`);

        }

        if (data.guardia_id) {

            await axios.get(`${USUARIOS_SERVICE}/guardias/${data.guardia_id}`);

        }

    } catch (error) {

        throw new Error("Las entidades relacionadas no existen");

    }

    return await incidentesModel.createIncidente(data);

}
async function getIncidentes() {
    console.log("Estoy entrando");


    const resultado = await incidentesModel.getIncidentes();
    console.log("Resultado de la consulta:", resultado);

    for (const incidente of resultado) {
        if (incidente.preso_id) {
            const preso = await axios.get(`${USUARIOS_SERVICE}/presos/${incidente.preso_id}`);
            const visitas = await axios.get(`${VISITAS_SERVICE}/visitas/preso/${incidente.preso_id}`);
            incidente.preso = preso.data;
            incidente.visitas = visitas.data;
        }

        if (incidente.guardia_id) {
            const guardia = await axios.get(`${USUARIOS_SERVICE}/guardias/${incidente.guardia_id}`);
            incidente.guardia = guardia.data;
        }

        delete incidente.preso_id;
        delete incidente.guardia_id;
    }

    return resultado;
}


async function getIncidenteId(id) {

    const incidente = await incidentesModel.getIncidenteId(id);

    if (!incidente) {
        throw new Error("Incidente no encontrado");
    }

    if (incidente.preso_id) {
        const [preso, visitas] = await Promise.all([
            axios.get(`${USUARIOS_SERVICE}/presos/${incidente.preso_id}`),
            axios.get(`${VISITAS_SERVICE}/visitas/preso/${incidente.preso_id}`)
        ]);
        incidente.preso = preso.data;
        incidente.visitas = visitas.data;
    }

    if (incidente.guardia_id) {
        const [guardia] = await Promise.all([
            axios.get(`${USUARIOS_SERVICE}/guardias/${incidente.guardia_id}`)
        ]);
        incidente.guardia = guardia.data;
    }

    delete incidente.preso_id;
    delete incidente.guardia_id;

    return incidente;
}


async function updateIncidente(id, data) {

    try {

        if (data.preso_id) {
            await axios.get(`${USUARIOS_SERVICE}/presos/${data.preso_id}`);
        }

        if (data.guardia_id) {
            await axios.get(`${USUARIOS_SERVICE}/guardias/${data.guardia_id}`);
        }

    } catch (error) {
        throw new Error("Las entidades relacionadas no existen");
    }

    await incidentesModel.updateIncidente(id, data);

    return { message: "Incidente actualizado correctamente" };
}




async function getIncidentesPorPreso(preso_id) {

    return await incidentesModel.getIncidentesPorPreso(preso_id);

}

module.exports = {
    createIncidente,
    getIncidentes,
    getIncidenteId,
    getIncidentesPorPreso,
    updateIncidente
};