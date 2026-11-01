import { fechaCalendario, validarSemana, diasSemana } from '../../models/validations/horariosSemanales.js';
import { configuracionAgenda } from '../../config/agenda.js';
import db from '../../config/db.js';
import Usuario from '../../models/Usuario.js';
import Medico from '../../models/Medico.js';
import Horario from '../../models/Horario.js';
import SolicitudHorario from '../../models/SolicitudHorario.js';
import SolicitudHorarioDetalle from '../../models/SolicitudHorarioDetalle.js';
import { crearServicioSolicitudesHorarios, ErrorSolicitudHorario } from '../../services/medico/solicitudesHorariosService.js';

const estadosError = {
    DATOS_INVALIDOS: 400,
    SEMANA_NO_PERMITIDA: 400,
    SESION_INVALIDA: 401,
    SIN_PERMISO: 403,
    MEDICO_INEXISTENTE: 404,
    SOLICITUD_PENDIENTE: 409,
    ESTADO_INCONSISTENTE: 409,
    PUBLICACION_LEGADO: 409,
    SIN_CAMBIOS: 409,
    REVISION_DESACTUALIZADA: 409,
    CONFLICTO_CONCURRENCIA: 409,
};

// El servicio conserva las validaciones y la transacción; el controlador traduce HTTP.
export function crearControladorSolicitudesHorarios(presentarSolicitud) {
    return async (req, res) => {
        if (!req.usuario?.id_usuario) {
            return res.status(401).json({ codigo: 'SESION_INVALIDA', mensaje: 'Se requiere una sesión válida.' });
        }
        try {
            const resultado = await presentarSolicitud(req.usuario.id_usuario, req.body);
            return res.status(201).json({
                mensaje: 'Solicitud semanal registrada y pendiente de aprobación.',
                ...resultado,
            });
        } catch (error) {
            const estado = error instanceof ErrorSolicitudHorario && estadosError[error.codigo];
            if (estado) {
                return res.status(estado).json({ codigo: error.codigo, mensaje: error.message });
            }
            return res.status(500).json({ mensaje: 'No se pudo registrar la solicitud semanal.' });
        }
    };
}

export const presentarSolicitudHorario = crearControladorSolicitudesHorarios(
    crearServicioSolicitudesHorarios({ db, Usuario, Medico, SolicitudHorario, SolicitudHorarioDetalle, Horario })
);

// La consulta solo utiliza el perfil asociado a la sesión, nunca un médico del navegador.
export function crearConsultaSolicitudesHorarios({ Medico, SolicitudHorario, SolicitudHorarioDetalle }) {
    return async (req, res) => {
        if (!req.usuario?.id_usuario) return res.status(401).json({ mensaje: 'Se requiere una sesión válida.' });
        let inicio, fin;
        try {
            inicio = req.query.fecha_inicio;
            const domingo = fechaCalendario(inicio);
            domingo.setUTCDate(domingo.getUTCDate() + 6);
            fin = domingo.toISOString().slice(0, 10);
            validarSemana(inicio, fin);
        } catch {
            return res.status(400).json({ mensaje: 'Selecciona una fecha válida que corresponda a lunes.' });
        }
        try {
            const medico = await Medico.findOne({ where: { usuario_id: req.usuario.id_usuario }, attributes: ['id_medico'] });
            if (!medico) return res.status(404).json({ mensaje: 'No existe el perfil médico.' });
            const rows = await SolicitudHorario.findAll({
                where: { medico_id: medico.id_medico, fecha_inicio: inicio },
                attributes: ['id_solicitud', 'fecha_inicio', 'fecha_fin', 'version', 'estado', 'fecha_creacion', 'fecha_decision', 'motivo_decision'],
                include: [{ model: SolicitudHorarioDetalle, as: 'Detalles', attributes: ['id_detalle', 'dia_semana', 'hora_inicio', 'hora_fin'] }],
                order: [['version', 'DESC'], ['id_solicitud', 'DESC']],
            });
            const solicitudes = rows.map(row => {
                const r = row.get({ plain: true });
                return {
                    id_solicitud: r.id_solicitud, fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin,
                    version: r.version, estado: r.estado, fecha_creacion: r.fecha_creacion,
                    fecha_decision: r.fecha_decision, motivo_decision: r.motivo_decision,
                    detalles: r.Detalles.map(d => ({ id_detalle: d.id_detalle, dia_semana: d.dia_semana, hora_inicio: d.hora_inicio, hora_fin: d.hora_fin }))
                        .sort((a, b) => diasSemana.indexOf(a.dia_semana) - diasSemana.indexOf(b.dia_semana) || a.hora_inicio.localeCompare(b.hora_inicio) || a.hora_fin.localeCompare(b.hora_fin) || a.id_detalle - b.id_detalle),
                };
            });
            res.set('Cache-Control', 'no-store');
            return res.json({ fecha_inicio: inicio, fecha_fin: fin, solicitudes, configuracion: configuracionAgenda });
        } catch {
            return res.status(500).json({ mensaje: 'No se pudieron consultar las solicitudes semanales.' });
        }
    };
}

export const listarSolicitudesHorarios = crearConsultaSolicitudesHorarios({ Medico, SolicitudHorario, SolicitudHorarioDetalle });
