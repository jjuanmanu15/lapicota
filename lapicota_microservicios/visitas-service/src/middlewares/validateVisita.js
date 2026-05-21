const axios = require('axios');

const USUARIOS_SERVICE = 'http://localhost:3001';

const ESTADOS_VALIDOS = [
    'PENDIENTE',
    'APROBADA',
    'RECHAZADA',
    'PERMITIDA',
    'DENEGADA',
    'FINALIZADA',
    'CANCELADA'
];

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

function esHoraValida(hora) {
    return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(hora);
}

function normalizarTexto(valor) {
    return typeof valor === 'string' ? valor.trim() : valor;
}

async function validarCreacionVisita(req, res, next) {
    try {
        let {
            nombre_visitante,
            documento_visitante,
            preso_id,
            fecha_visita,
            hora_visita,
            estado_visita,
            motivo_denegacion
        } = req.body;

        nombre_visitante = normalizarTexto(nombre_visitante);
        documento_visitante = normalizarTexto(documento_visitante);
        estado_visita = normalizarTexto(estado_visita);
        motivo_denegacion = normalizarTexto(motivo_denegacion);

        if (
            !nombre_visitante ||
            !documento_visitante ||
            !preso_id ||
            !fecha_visita ||
            !hora_visita
        ) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios'
            });
        }

        if (typeof nombre_visitante !== 'string' || nombre_visitante.length < 3 || nombre_visitante.length > 150) {
            return res.status(400).json({
                error: 'nombre_visitante debe tener entre 3 y 150 caracteres'
            });
        }

        if (!/^\d{5,30}$/.test(documento_visitante)) {
            return res.status(400).json({
                error: 'documento_visitante debe contener solo dígitos y tener entre 5 y 30 caracteres'
            });
        }

        if (!Number.isInteger(Number(preso_id)) || Number(preso_id) <= 0) {
            return res.status(400).json({
                error: 'preso_id debe ser un entero positivo'
            });
        }

        if (!esFechaValida(fecha_visita)) {
            return res.status(400).json({
                error: 'fecha_visita debe tener formato YYYY-MM-DD'
            });
        }

        if (!esHoraValida(hora_visita)) {
            return res.status(400).json({
                error: 'hora_visita debe tener formato HH:MM o HH:MM:SS'
            });
        }

        const estadoFinal = estado_visita || 'PENDIENTE';

        if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
            return res.status(400).json({
                error: 'Estado de visita inválido'
            });
        }

        if (
            (estadoFinal === 'RECHAZADA' || estadoFinal === 'DENEGADA') &&
            !motivo_denegacion
        ) {
            return res.status(400).json({
                error: 'Debe especificar motivo de denegación'
            });
        }

        try {
            const response = await axios.get(`${USUARIOS_SERVICE}/presos/${preso_id}`);
            const preso = response.data;

            if (!preso) {
                return res.status(400).json({
                    error: 'El preso no existe en el microservicio de usuarios'
                });
            }

            const estadosNoPermitidos = ['EN AISLAMIENTO', 'TRASLADADO', 'LIBERADO'];
            if (!preso.estado || preso.estado.toUpperCase() !== 'ACTIVO') {
                return res.status(400).json({
                    error: `No se puede registrar visita: preso en estado '${preso.estado || 'DESCONOCIDO'}'`
                });
            }

            if (
                preso.numero_documento &&
                String(preso.numero_documento).trim() === documento_visitante
            ) {
                return res.status(400).json({
                    error: 'El documento del visitante no puede coincidir con el documento del preso'
                });
            }

            if (preso.fecha_ingreso && fecha_visita < preso.fecha_ingreso) {
                return res.status(400).json({
                    error: 'La fecha de visita no puede ser anterior a la fecha de ingreso del preso'
                });
            }

            req.preso = preso;
        } catch (error) {
            return res.status(400).json({
                error: 'El preso no existe en el microservicio de usuarios'
            });
        }

        req.body.nombre_visitante = nombre_visitante;
        req.body.documento_visitante = documento_visitante;
        req.body.preso_id = Number(preso_id);
        req.body.estado_visita = estadoFinal;
        req.body.motivo_denegacion = motivo_denegacion || null;

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Error validando la visita'
        });
    }
}

async function validarCambioEstadoVisita(req, res, next) {
    try {
        let { estado_visita, motivo_denegacion } = req.body;
        const { id } = req.params;

        estado_visita = normalizarTexto(estado_visita);
        motivo_denegacion = normalizarTexto(motivo_denegacion);

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                error: 'El id de la visita debe ser un entero positivo'
            });
        }

        if (!estado_visita) {
            return res.status(400).json({
                error: 'Debe enviar estado_visita'
            });
        }

        if (!ESTADOS_VALIDOS.includes(estado_visita)) {
            return res.status(400).json({
                error: 'Estado inválido'
            });
        }

        if (
            (estado_visita === 'RECHAZADA' || estado_visita === 'DENEGADA') &&
            !motivo_denegacion
        ) {
            return res.status(400).json({
                error: 'Debe especificar motivo de denegación'
            });
        }

        if (estado_visita !== 'RECHAZADA' && estado_visita !== 'DENEGADA') {
            req.body.motivo_denegacion = null;
        } else {
            req.body.motivo_denegacion = motivo_denegacion;
        }

        req.body.estado_visita = estado_visita;

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Error validando el cambio de estado'
        });
    }
}

module.exports = {
    validarCreacionVisita,
    validarCambioEstadoVisita,
    ESTADOS_VALIDOS
};