const connection = require('../config/db');
async function getGuardias() {
    const [rows] = await connection.query('SELECT * FROM guardias');
    return rows;
}

async function getGuardiasById(id) {
    const [rows] = await connection.query('SELECT * FROM guardias WHERE id_guardia = ?', [id]);
    return rows[0];
}

async function createGuardia(guardia) {
    const sql = `
        INSERT INTO guardias
        (numero_documento,nombres,apellidos,fecha_nacimiento,rango,turno,patio_asignado,zona_asignada,estado)
        VALUES (?,?,?,?,?,?,?,?,?)
    `;

    const [result] = await connection.query(sql, [
        guardia.numero_documento,
        guardia.nombres,
        guardia.apellidos,
        guardia.fecha_nacimiento,
        guardia.rango,
        guardia.turno,
        guardia.patio_asignado,
        guardia.zona_asignada,
        guardia.estado
    ]);

    return result;
}

async function updateGuardia(id_guardia, guardia) {
    const sql = `
        UPDATE guardias
        SET numero_documento = ?, nombres = ?, apellidos = ?, fecha_nacimiento = ?, rango = ?, turno = ?, patio_asignado = ?, zona_asignada = ?, estado = ?
        WHERE id_guardia = ?
        `;

    const [result] = await connection.query(sql, [
        guardia.numero_documento,
        guardia.nombres,
        guardia.apellidos,
        guardia.fecha_nacimiento,
        guardia.rango,
        guardia.turno,
        guardia.patio_asignado,
        guardia.zona_asignada,
        guardia.estado,
        id_guardia
    ]);

    return result;
}

module.exports = {
    getGuardias,
    getGuardiasById,
    createGuardia,
    updateGuardia
}