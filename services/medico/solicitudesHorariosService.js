import { createHash } from 'node:crypto';
import { Op } from 'sequelize';
import { configuracionAgenda, permitirSemanaActualYFuturas } from '../../config/agenda.js';
import { diasSemana, validarSemana, validarFranjas, segundosHorario } from '../../models/validations/horariosSemanales.js';

export class ErrorSolicitudHorario extends Error {
    constructor(codigo, mensaje) { super(mensaje); this.name = 'ErrorSolicitudHorario'; this.codigo = codigo; }
}
const fail = (code, message) => { throw new ErrorSolicitudHorario(code, message); };
const plain = row => row?.get ? row.get({ plain: true }) : row;
const positive = value => Number.isSafeInteger(value) && value > 0;
const normalizeTime = value => value.length === 5 ? value + ':00' : value;
const order = (a, b) => diasSemana.indexOf(a.dia_semana) - diasSemana.indexOf(b.dia_semana) || a.hora_inicio.localeCompare(b.hora_inicio) || a.hora_fin.localeCompare(b.hora_fin);
const configKeys = ['duracionConsultaMinutos', 'descansoPosteriorMinutos'];
function validateConfig(config) {
    if (!config || !positive(config.duracionConsultaMinutos) || config.duracionConsultaMinutos > 720 || !Number.isSafeInteger(config.descansoPosteriorMinutos) || config.descansoPosteriorMinutos < 0 || config.descansoPosteriorMinutos > 1440) throw new TypeError('Configuracion de duracion/descanso no valida');
    return Object.freeze(Object.fromEntries(configKeys.map(k => [k, config[k]])));
}
function prepare(input, config) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['fecha_inicio', 'fecha_fin', 'franjas', 'revision_base'].includes(k))) fail('DATOS_INVALIDOS', 'Campos de solicitud no validos');
    if (input.revision_base !== undefined && (typeof input.revision_base !== 'string' || !/^[a-f0-9]{64}$/.test(input.revision_base))) fail('DATOS_INVALIDOS', 'Revision base no valida');
    try {
        validarSemana(input.fecha_inicio, input.fecha_fin);
        if (!Array.isArray(input.franjas) || input.franjas.some(f => !f || typeof f !== 'object' || Array.isArray(f) || Object.keys(f).some(k => !['dia_semana', 'hora_inicio', 'hora_fin'].includes(k)))) throw new Error('Campos de franja no validos');
        validarFranjas(input.franjas);
        const franjas = input.franjas.map(f => ({ dia_semana: f.dia_semana, hora_inicio: normalizeTime(f.hora_inicio), hora_fin: normalizeTime(f.hora_fin) })).sort(order);
        // Las franjas contiguas forman un intervalo continuo; no se exige descanso ni inicio en minutos fijos.
        for (let i = 0; i < franjas.length;) {
            const day = franjas[i].dia_semana, start = segundosHorario(franjas[i].hora_inicio);
            let end = segundosHorario(franjas[i++].hora_fin);
            while (i < franjas.length && franjas[i].dia_semana === day && segundosHorario(franjas[i].hora_inicio) === end) end = segundosHorario(franjas[i++].hora_fin);
            if (end - start < config.duracionConsultaMinutos * 60) throw new Error('Cada intervalo continuo debe permitir al menos una consulta completa');
        }
        return { fecha_inicio: input.fecha_inicio, fecha_fin: input.fecha_fin, revision_base: input.revision_base, franjas };
    } catch (error) { fail('DATOS_INVALIDOS', error.message); }
}
export function revisionPublicacionSemanal(rows) {
    const snapshot = rows.map(plain).map(r => [r.id_horario, r.medico_id, r.fecha_inicio, r.fecha_fin, r.dia_semana, r.hora_inicio, r.hora_fin, r.estado, r.aprobado_por, r.fecha_creacion, r.solicitud_detalle_id, r.vigente, r.sustituido_por_solicitud_id]).sort((a, b) => a[0] - b[0]);
    return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}
function authorize(user, usuarioId) {
    if (!user || user.id_usuario !== usuarioId) fail('SESION_INVALIDA', 'No existe el usuario autenticado');
    if (user.rol_id !== 2 || ![true, 1].includes(user.estado)) fail('SIN_PERMISO', 'Se requiere un usuario medico activo');
}

// No importa la conexión ni los modelos de la aplicación; quien llama al servicio proporciona esas dependencias.
// La regla de semanas permitidas es configurable y permite proporcionar la fecha actual durante las pruebas.
export function crearServicioSolicitudesHorarios({ db, Usuario, Medico, SolicitudHorario, SolicitudHorarioDetalle, Horario, politicaVigencia = permitirSemanaActualYFuturas, ahora = () => new Date(), configuracion = configuracionAgenda }) {
    if (typeof politicaVigencia !== 'function') throw new TypeError('La politica de vigencia debe ser una funcion');
    const config = validateConfig(configuracion);
    return async function presentarSolicitud(usuarioId, input) {
        if (!positive(usuarioId)) fail('SESION_INVALIDA', 'Identidad autenticada no valida');
        const proposal = prepare(input, config);
        if (await politicaVigencia({ fecha_inicio: proposal.fecha_inicio, fecha_fin: proposal.fecha_fin, ahora: ahora() }) !== true) fail('SEMANA_NO_PERMITIDA', 'La politica de vigencia no permite esta semana');
        try {
            return await db.transaction(async transaction => {
                const tx = { transaction };
                authorize(plain(await Usuario.findByPk(usuarioId, { ...tx, attributes: ['id_usuario', 'rol_id', 'estado'] })), usuarioId);
                const medico = plain(await Medico.findOne({ ...tx, where: { usuario_id: usuarioId }, attributes: ['id_medico', 'usuario_id'], lock: transaction.LOCK.UPDATE }));
                if (!medico) fail('MEDICO_INEXISTENTE', 'No existe el perfil medico');
                if (medico.usuario_id !== usuarioId) fail('SIN_PERMISO', 'El perfil no pertenece al usuario autenticado');
                // Primero se bloquea el perfil médico; después se vuelve a consultar y bloquear el usuario para comprobar sus permisos.
                authorize(plain(await Usuario.findByPk(usuarioId, { ...tx, attributes: ['id_usuario', 'rol_id', 'estado'], lock: transaction.LOCK.UPDATE })), usuarioId);
                if (await politicaVigencia({ fecha_inicio: proposal.fecha_inicio, fecha_fin: proposal.fecha_fin, ahora: ahora() }) !== true) fail('SEMANA_NO_PERMITIDA', 'La semana dejo de ser solicitable mientras esperaba el bloqueo');
                const history = (await SolicitudHorario.findAll({ ...tx, where: { medico_id: medico.id_medico, fecha_inicio: proposal.fecha_inicio }, order: [['version', 'ASC']], lock: transaction.LOCK.UPDATE })).map(plain);
                if (history.some(r => r.estado === 'Pendiente')) fail('SOLICITUD_PENDIENTE', 'Ya existe una solicitud pendiente para esta semana');
                if (history.some(r => r.fecha_fin !== proposal.fecha_fin || !positive(r.version))) fail('ESTADO_INCONSISTENTE', 'El historial semanal requiere revision');
                const version = history.reduce((max, r) => Math.max(max, r.version), 0) + 1;
                if (!positive(version) || version > 2147483647) fail('ESTADO_INCONSISTENTE', 'No es posible asignar otra version');
                const approved = (await Horario.findAll({ ...tx, where: { medico_id: medico.id_medico, estado: 'Aprobado', fecha_inicio: { [Op.lte]: proposal.fecha_fin }, fecha_fin: { [Op.gte]: proposal.fecha_inicio } }, order: [['id_horario', 'ASC']], lock: transaction.LOCK.UPDATE })).map(plain);
                if (approved.some(r => r.vigente == null)) fail('PUBLICACION_LEGADO', 'La disponibilidad aprobada sin clasificar requiere regularizacion antes de proponer su sustitucion');
                const published = approved.filter(r => r.vigente === true || r.vigente === 1);
                let baseId = null;
                if (published.length) {
                    if (published.some(r => r.fecha_inicio !== proposal.fecha_inicio || r.fecha_fin !== proposal.fecha_fin || !positive(r.solicitud_detalle_id))) fail('ESTADO_INCONSISTENTE', 'La publicacion no corresponde a una semana versionada');
                    const details = (await SolicitudHorarioDetalle.findAll({ ...tx, where: { id_detalle: { [Op.in]: published.map(r => r.solicitud_detalle_id) } }, attributes: ['id_detalle', 'solicitud_id'], lock: transaction.LOCK.UPDATE })).map(plain);
                    const byId = new Map(details.map(d => [d.id_detalle, d.solicitud_id]));
                    const ids = new Set(published.map(r => byId.get(r.solicitud_detalle_id)));
                    if (ids.size !== 1 || !positive([...ids][0])) fail('ESTADO_INCONSISTENTE', 'La publicacion tiene origen ambiguo');
                    baseId = [...ids][0];
                    if (!history.some(r => r.id_solicitud === baseId && r.estado === 'Aprobado')) fail('ESTADO_INCONSISTENTE', 'No se encontro la solicitud aprobada de origen');
                    const current = published.map(r => ({ dia_semana: r.dia_semana, hora_inicio: normalizeTime(r.hora_inicio), hora_fin: normalizeTime(r.hora_fin) })).sort(order);
                    if (JSON.stringify(current) === JSON.stringify(proposal.franjas)) fail('SIN_CAMBIOS', 'La propuesta es igual a la disponibilidad aprobada');
                }
                const revision = revisionPublicacionSemanal(published);
                if (proposal.revision_base !== undefined && proposal.revision_base !== revision) fail('REVISION_DESACTUALIZADA', 'La disponibilidad cambio; vuelve a consultar la semana');
                const request = plain(await SolicitudHorario.create({ medico_id: medico.id_medico, solicitado_por: usuarioId, fecha_inicio: proposal.fecha_inicio, fecha_fin: proposal.fecha_fin, version, solicitud_base_id: baseId, revision_base: revision, estado: 'Pendiente', decidido_por: null, fecha_decision: null, motivo_decision: null }, tx));
                const details = await SolicitudHorarioDetalle.bulkCreate(proposal.franjas.map(f => ({ ...f, solicitud_id: request.id_solicitud })), { ...tx, validate: true, hooks: true });
                return { solicitud: request, detalles: details.map(plain), configuracion: config };
            });
        } catch (error) {
            if (error instanceof ErrorSolicitudHorario) throw error;
            if (error.name === 'SequelizeUniqueConstraintError' || ['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.original?.code)) fail('CONFLICTO_CONCURRENCIA', 'Otra operacion modifico la semana; consulta de nuevo antes de presentar');
            throw error;
        }
    };
}
