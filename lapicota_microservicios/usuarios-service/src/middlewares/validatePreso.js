function validatePreso(req, res, next) {

    const {
        numero_documento,
        nombres,
        apellidos,
        fecha_nacimiento,
        fecha_ingreso,
        delito,
        estado,
        celda,
        patio
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
    const ingresoDate = fecha_ingreso ? new Date(fecha_ingreso) : null;

    if (fecha_nacimiento && isNaN(nacimientoDate.getTime())) {
        return res.status(400).json({ error: "Fecha de nacimiento inválida" });
    }

    if (fecha_ingreso && isNaN(ingresoDate.getTime())) {
        return res.status(400).json({ error: "Fecha de Ingreso inválida" });
    }

    // 🟡 Validar relación entre fechas (si ambas están presentes)
    if (nacimientoDate && ingresoDate) {
        if (nacimientoDate.getTime() === ingresoDate.getTime()) {
            return res.status(400).json({ error: "Fecha de nacimiento no puede ser igual a Fecha de ingreso" });
        }

        if (nacimientoDate.getTime() > ingresoDate.getTime()) {
            return res.status(400).json({ error: "Fecha de nacimiento debe ser anterior a Fecha de ingreso" });
        }
    }

    // 🟡 Estado (validaciones estrictas)
    const estadosValidos = ['ACTIVO', 'TRASLADADO', 'EN AISLAMIENTO', 'LIBERADO'];
    if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({
            error: `estado inválido. Usa: ${estadosValidos.join(', ')}`
        });
    }

    next();
}




module.exports = validatePreso;