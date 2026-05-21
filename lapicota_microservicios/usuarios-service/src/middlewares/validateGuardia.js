function validateGuardia(req, res, next) {

    const {
        numero_documento,
        nombres,
        apellidos,
        fecha_nacimiento,
        rango,
        turno,
        patio_asignado,
        zona_asignada,
        estado
    } = req.body;

    // 🔴 Obligatorios
    if (!numero_documento || !nombres || !apellidos) {
        return res.status(400).json({
            error: "numero_documento, nombres y apellidos son obligatorios"
        });
    }

    // 🔴 Tipos básicos
    if (typeof numero_documento !== 'string') {
        return res.status(400).json({ error: "numero_documento debe ser texto" });
    }

    if (typeof nombres !== 'string' || typeof apellidos !== 'string') {
        return res.status(400).json({ error: "nombres y apellidos deben ser texto" });
    }

    // 🔴 Validación de cédula (solo dígitos, longitud mínima)
    const cedulaRegex = /^\d+$/;
    if (!cedulaRegex.test(numero_documento)) {
        return res.status(400).json({ error: "numero_documento debe contener solo dígitos" });
    }

    // 🔴 Longitudes
    if (numero_documento.length < 5) {
        return res.status(400).json({ error: "numero_documento inválido" });
    }

    // 🟡 Fechas (opcionales pero válidas)
    const nacimientoDate = fecha_nacimiento ? new Date(fecha_nacimiento) : null;

    if (fecha_nacimiento && isNaN(nacimientoDate.getTime())) {
        return res.status(400).json({ error: "fecha_nacimiento inválida" });
    }

    // 🟡 Validar que la fecha de nacimiento sea una edad razonable (mayor de edad)
    if (nacimientoDate) {
        const hoy = new Date();
        const edad = hoy.getFullYear() - nacimientoDate.getFullYear();
        const mesActual = hoy.getMonth() - nacimientoDate.getMonth();
        const diaActual = hoy.getDate() - nacimientoDate.getDate();

        const edadReal = mesActual < 0 || (mesActual === 0 && diaActual < 0) ? edad - 1 : edad;

        if (edadReal < 18) {
            return res.status(400).json({ error: "El guardia debe ser mayor de 18 años" });
        }

        if (edadReal > 65) {
            return res.status(400).json({ error: "El guardia no puede ser mayor de 65 años" });
        }
    }

    // 🟡 Rango (valores válidos)
    const rangosValidos = ['PENITENCIARIO', 'SUBOFICIAL', 'OFICIAL', 'SUPERINTENDENTE'];
    if (rango && !rangosValidos.includes(rango.toUpperCase())) {
        return res.status(400).json({
            error: `rango inválido. Usa: ${rangosValidos.join(', ')}`
        });
    }

    // 🟡 Turno (valores válidos)
    const turnosValidos = ['MAÑANA', 'TARDE', 'NOCHE'];
    if (turno && !turnosValidos.includes(turno.toUpperCase())) {
        return res.status(400).json({
            error: `turno inválido. Usa: ${turnosValidos.join(', ')}`
        });
    }

    // 🟡 Patio asignado (debe ser texto si está presente)
    if (patio_asignado && typeof patio_asignado !== 'string') {
        return res.status(400).json({ error: "patio_asignado debe ser texto" });
    }

    // 🟡 Zona asignada (debe ser texto si está presente)
    if (zona_asignada && typeof zona_asignada !== 'string') {
        return res.status(400).json({ error: "zona_asignada debe ser texto" });
    }

    // 🟡 Estado (puedes controlar valores)
    const estadosValidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'JUBILADO'];
    if (estado && !estadosValidos.includes(estado.toUpperCase())) {
        return res.status(400).json({
            error: `estado inválido. Usa: ${estadosValidos.join(', ')}`
        });
    }

    next();
}

module.exports = validateGuardia;
