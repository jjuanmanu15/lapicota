const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'lapicota'
});

async function obtenerVisitas() {
    const [result] = await connection.query('SELECT * FROM visitas ORDER BY id_visita DESC');
    return result;
}

async function obtenerVisitaPorId(id) {
    const [result] = await connection.query(
        'SELECT * FROM visitas WHERE id_visita = ?',
        [id]
    );
    return result[0];
}

async function obtenerVisitasPorPreso(preso_id) {
    const [result] = await connection.query(
        'SELECT * FROM visitas WHERE preso_id = ? ORDER BY fecha_visita DESC, hora_visita DESC',
        [preso_id]
    );
    return result;
}

async function obtenerVisitasPorFecha(fecha_visita) {
    const [result] = await connection.query(
        'SELECT * FROM visitas WHERE fecha_visita = ? ORDER BY hora_visita ASC',
        [fecha_visita]
    );
    return result;
}

async function obtenerVisitasPorNombreVisitante(nombre_visitante) {
    const [result] = await connection.query(
        'SELECT * FROM visitas WHERE nombre_visitante LIKE ? ORDER BY fecha_visita DESC, hora_visita DESC',
        [`%${nombre_visitante}%`]
    );
    return result;
}

async function crearVisita(
    nombre_visitante,
    documento_visitante,
    preso_id,
    fecha_visita,
    hora_visita,
    estado_visita,
    motivo_denegacion
) {
    const query = `
        INSERT INTO visitas
        (
            nombre_visitante,
            documento_visitante,
            preso_id,
            fecha_visita,
            hora_visita,
            estado_visita,
            motivo_denegacion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(query, [
        nombre_visitante,
        documento_visitante,
        preso_id,
        fecha_visita,
        hora_visita,
        estado_visita,
        motivo_denegacion
    ]);

    return result;
}

async function cambiarEstadoVisita(id, estado_visita, motivo_denegacion) {
    const query = `
        UPDATE visitas
        SET estado_visita = ?, motivo_denegacion = ?
        WHERE id_visita = ?
    `;

    const [result] = await connection.query(query, [
        estado_visita,
        motivo_denegacion,
        id
    ]);

    return result;
}

async function obtenerVisitaDuplicada(
    nombre_visitante,
    documento_visitante,
    preso_id,
    fecha_visita,
    hora_visita
) {
    const [result] = await connection.query(
        `SELECT * FROM visitas
         WHERE nombre_visitante = ?
         AND documento_visitante = ?
         AND preso_id = ?
         AND fecha_visita = ?
         AND hora_visita = ?
         LIMIT 1`,
        [
            nombre_visitante,
            documento_visitante,
            preso_id,
            fecha_visita,
            hora_visita
        ]
    );

    return result[0];
}

module.exports = {
    obtenerVisitas,
    obtenerVisitaPorId,
    obtenerVisitasPorPreso,
    obtenerVisitasPorFecha,
    obtenerVisitasPorNombreVisitante,
    obtenerVisitaDuplicada,
    crearVisita,
    cambiarEstadoVisita
};