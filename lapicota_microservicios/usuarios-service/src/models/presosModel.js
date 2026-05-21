const connection = require('../config/db');

async function createPeso(preso) {
    const sql = `
        INSERT INTO presos
        (numero_documento,nombres,apellidos,fecha_nacimiento,fecha_ingreso,delito,estado,celda,patio)
        VALUES (?,?,?,?,?,?,?,?,?)
    `

    const [result] = await connection.query(sql, [
        preso.numero_documento,
        preso.nombres,
        preso.apellidos,
        preso.fecha_nacimiento,
        preso.fecha_ingreso,
        preso.delito,
        preso.estado,
        preso.celda,
        preso.patio
    ]);

    return result;
}

async function getPresos() {
    const sql = `
        SELECT * FROM presos
    `

    const [result] = await connection.query(sql);

    return result;
}

async function getPresoForId(id) {
    const sql = `
        SELECT * FROM presos
        WHERE id_preso = ?
    `

    const [result] = await connection.query(sql, [id]);

    return result[0];
}

async function getPresoForCC(numero_documento) {
    const [rows] = await connection.query(
        'SELECT * FROM presos WHERE numero_documento = ?',
        [numero_documento]
    );
    return rows[0];
}
async function updatePreso(id, preso) {
    console.log(preso, "desde presos serice")
    console.log(id, "desde presos serice")
    console.log(preso.numero_documento, "desde presos serice")

    const sql = `
        UPDATE presos
        SET numero_documento = ?, 
            nombres = ?, 
            apellidos = ?, 
            fecha_nacimiento = ?, 
            fecha_ingreso = ?, 
            delito = ?, 
            estado = ?, 
            celda = ?, 
            patio = ?
        WHERE id_preso = ?
    `;

    const [result] = await connection.query(sql, [
        preso.numero_documento,
        preso.nombres,
        preso.apellidos,
        preso.fecha_nacimiento,
        preso.fecha_ingreso,
        preso.delito,
        preso.estado,
        preso.celda,
        preso.patio,
        id   // ← aquí estaba el error
    ]);


    return result;
}
module.exports = {
    createPeso,
    getPresos,
    getPresoForId,
    updatePreso,
    getPresoForCC

}