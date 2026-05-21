const connection = require('../config/db');
const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];

async function createIncidente(incidente) {
    if (incidente.estado_incidente && !estadosValidos.includes(incidente.estado_incidente)) {
        throw new Error('Estado inválido');
    }

    const sql = `
        INSERT INTO incidentes
        (tipo_incidente, descripcion, fecha_incidente, hora_incidente, preso_id, guardia_id, estado_incidente)
        VALUES (?,?,?,?,?,?,?)
    `;

    const [result] = await connection.query(sql, [
        incidente.tipo_incidente,
        incidente.descripcion,
        incidente.fecha_incidente,
        incidente.hora_incidente,
        incidente.preso_id,
        incidente.guardia_id,
        incidente.estado_incidente || 'PENDIENTE' // por si no lo mandan
    ]);

    return result;
}


async function getIncidentes() {
    const [rows] = await connection.query('SELECT * FROM incidentes');
    return rows;
}

async function getIncidenteId(id) {
    const [rows] = await connection.query(
        'SELECT * FROM incidentes WHERE id_incidente=?',
        [id]
    );
    return rows[0];
}

async function getIncidentesPorPreso(preso_id) {
    const [rows] = await connection.query(
        'SELECT * FROM incidentes WHERE preso_id=?',
        [preso_id]
    );
    return rows;
}
async function updateIncidente(id, incidente) {
    if (incidente.estado_incidente && !estadosValidos.includes(incidente.estado_incidente)) {
        throw new Error('Estado inválido');
    }

    const sql = `
        UPDATE incidentes
        SET tipo_incidente=?, descripcion=?, fecha_incidente=?, hora_incidente=?, preso_id=?, guardia_id=?, estado_incidente=?
        WHERE id_incidente=?
    `;

    const [result] = await connection.query(sql, [
        incidente.tipo_incidente,
        incidente.descripcion,
        incidente.fecha_incidente,
        incidente.hora_incidente,
        incidente.preso_id,
        incidente.guardia_id,
        incidente.estado_incidente,
        id
    ]);

    return result;
}

async function eliminarIncidente(id) {
    const [result] = await connection.query('DELETE FROM incidentes WHERE id_incidente=?', [id]);
    return result;
}

module.exports = {
    createIncidente,
    getIncidentes,
    getIncidenteId,
    getIncidentesPorPreso,
    updateIncidente,
    eliminarIncidente
};