const guardiasModel = require('../models/guardiasModel');

async function getGuardias() {
    const result = await guardiasModel.getGuardias();
    return result;
}


async function getGuardiasById(id) {
    const result = await guardiasModel.getGuardiasById(id);
    if (!result) {
        throw new Error('La guardia no existe');
    }
    return result;
}

async function getGuardiaByCedula(numero_documento) {
    const result = await guardiasModel.getGuardiasById(numero_documento);
    if (!result) {
        throw new Error('La guardia no existe');
    }
    return result;
}

async function createGuardias(guardias) {
    const existeGuardia = await guardiasModel.getGuardiasById(guardias.numero_documento);
    if (existeGuardia) {
        throw new Error('La guardia ya existe');
    }

    const result = await guardiasModel.createGuardia(guardias);
    return result;
}
async function updateGuardias(id_guardia, guardias) {
    const existeGuardia = await guardiasModel.getGuardiasById(id_guardia);

    if (!existeGuardia) {
        throw new Error('La guardia no existe');
    }

    // Si se intenta cambiar la cédula, validar que no exista otra guardia con esa cédula
    if (guardias.numero_documento && guardias.numero_documento !== existeGuardia.numero_documento) {
        const otraGuardia = await guardiasModel.getGuardiasById(guardias.numero_documento);
        if (otraGuardia && Number(otraGuardia.id_guardia) !== Number(id_guardia)) {
            throw new Error('Ya existe una guardia con esa cédula');
        }
    }

    const result = await guardiasModel.updateGuardia(id_guardia, guardias);
    console.log('Resultado de la actualización de la guardia:', result);

    return result;
}

module.exports = {
    getGuardias,
    getGuardiasById,
    getGuardiaByCedula,
    createGuardias,
    updateGuardias
}