const presosModel = require('../models/presosModel');

async function createPreso(preso) {
    const existePreso = await presosModel.getPresoForCC(preso.numero_documento);

    if (existePreso) {
        throw new Error('El preso ya existe');
    }

    const result = await presosModel.createPeso(preso);

    return result;
}

async function getPresos() {
    const result = await presosModel.getPresos();

    return result;
}

async function getPresoForId(id) {
    const result = await presosModel.getPresoForId(id);
    if (!result) {
        throw new Error('El preso no existe');
    }
    return result;
}

async function getPresoByCedula(numero_documento) {
    const result = await presosModel.getPresoForCC(numero_documento);
    if (!result) {
        throw new Error('El preso no existe');
    }
    return result;
}

async function updatePreso(id, preso) {
    const existentePorId = await presosModel.getPresoForId(id);

    if (!existentePorId) {
        throw new Error('El preso no existe');
    }

    // Si el número de documento cambia, asegurarse de que no exista otro preso con esa cédula
    if (preso.numero_documento && preso.numero_documento !== existentePorId.numero_documento) {
        const otroPreso = await presosModel.getPresoForCC(preso.numero_documento);
        if (otroPreso && Number(otroPreso.id_preso) !== Number(id)) {
            throw new Error('Ya existe un preso con esa cédula');
        }
    }

    const result = await presosModel.updatePreso(id, preso);

    return result;
}

module.exports = {
    createPreso,
    getPresos,
    getPresoForId,
    getPresoByCedula,
    updatePreso
}