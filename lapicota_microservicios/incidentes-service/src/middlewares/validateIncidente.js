function validateIncidente(req, res, next) {
    const {
        tipo_incidente,
        descripcion,
        fecha_incidente,
        hora_incidente,
        preso_id,
        guardia_id,
        estado_incidente
    } = req.body;

    // 🔴 Campos obligatorios
    if (!tipo_incidente || !descripcion || !fecha_incidente || !hora_incidente) {
        return res.status(400).json({
            error: 'tipo_incidente, descripcion, fecha_incidente y hora_incidente son obligatorios'
        });
    }

    // 🔴 Tipos básicos
    if (typeof tipo_incidente !== 'string' || !tipo_incidente.trim()) {
        return res.status(400).json({ error: 'tipo_incidente debe ser texto no vacío' });
    }

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
        return res.status(400).json({ error: 'descripcion debe ser texto no vacío' });
    }

    // 🟡 Fecha incidente (debe ser válida y no futura)
    const fechaIncidente = new Date(fecha_incidente);
    if (isNaN(fechaIncidente.getTime())) {
        return res.status(400).json({ error: 'fecha_incidente inválida' });
    }

    const ahora = new Date();
    if (fechaIncidente.getTime() > ahora.getTime()) {
        return res.status(400).json({ error: 'fecha_incidente no puede ser futura' });
    }

    // 🟡 Hora incidente (formato HH:MM)
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (typeof hora_incidente !== 'string' || !horaRegex.test(hora_incidente)) {
        return res.status(400).json({ error: 'hora_incidente debe estar en formato HH:MM (24h)' });
    }

    // 🟡 Relación con preso/guardia (si se envía debe ser un número válido)
    if (preso_id !== undefined && (typeof preso_id !== 'number' || isNaN(preso_id) || preso_id <= 0)) {
        return res.status(400).json({ error: 'preso_id debe ser un número válido' });
    }

    if (guardia_id !== undefined && (typeof guardia_id !== 'number' || isNaN(guardia_id) || guardia_id <= 0)) {
        return res.status(400).json({ error: 'guardia_id debe ser un número válido' });
    }

    // 🟡 Estado incidente (si se envía, debe ser válido)
    const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];
    if (estado_incidente && !estadosValidos.includes(estado_incidente)) {
        return res.status(400).json({ error: `estado_incidente inválido. Usa: ${estadosValidos.join(', ')}` });
    }

    next();
}

module.exports = validateIncidente;
