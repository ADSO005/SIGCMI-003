import { createHash } from "node:crypto";
import { Op } from "sequelize";

export class ErrorHorario extends Error {
    constructor(status, message) { super(message); this.status = status; }
}
export const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
export function normalizarHora(hora) {
    if (typeof hora !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(hora)) {
        throw new ErrorHorario(400, "Formato de hora no válido");
    }
    return hora.length === 5 ? hora + ":00" : hora;
}
export function validarHorarios(horarios) {
    if (!Array.isArray(horarios) || horarios.length > 200) throw new ErrorHorario(400, "Envía un arreglo de hasta 200 franjas");
    const ids = new Set();
    return horarios.map(h => {
        if (!h || typeof h !== "object" || Array.isArray(h) ||
            Object.keys(h).some(k => !["id_horario", "dia_semana", "hora_inicio", "hora_fin"].includes(k))) {
            throw new ErrorHorario(400, "Campos de horario no válidos");
        }
        if (!diasSemana.includes(h.dia_semana)) throw new ErrorHorario(400, "Día de la semana no válido");
        if (h.id_horario !== undefined && (!Number.isSafeInteger(h.id_horario) || h.id_horario <= 0 || ids.has(h.id_horario))) {
            throw new ErrorHorario(400, "Identificador de horario inválido o duplicado");
        }
        if (h.id_horario !== undefined) ids.add(h.id_horario);
        const inicio = normalizarHora(h.hora_inicio), fin = normalizarHora(h.hora_fin);
        if (inicio >= fin) throw new ErrorHorario(400, "La hora de inicio debe ser anterior a la final");
        return { ...(h.id_horario !== undefined ? { id_horario: h.id_horario } : {}), dia_semana: h.dia_semana, hora_inicio: inicio, hora_fin: fin };
    });
}
const plano = h => h.get ? h.get({ plain: true }) : h;
export function revisionHorarios(horarios) {
    const rows = horarios.map(plano).map(h => [h.id_horario, h.dia_semana, h.hora_inicio, h.hora_fin, h.estado, h.aprobado_por, h.fecha_creacion])
        .sort((a, b) => a[0] - b[0]);
    return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
const igual = (a, b) => a.dia_semana === b.dia_semana && normalizarHora(a.hora_inicio) === b.hora_inicio && normalizarHora(a.hora_fin) === b.hora_fin;
const solapa = (a, b) => a.dia_semana === b.dia_semana && a.hora_inicio < b.hora_fin && b.hora_inicio < a.hora_fin;
function ahoraBogota() {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    return { fecha: p.year + "-" + p.month + "-" + p.day, hora: p.hour + ":" + p.minute + ":" + p.second };
}
export function crearServicioHorarios({ db, Medico, Horario, Cita, ahora = ahoraBogota }) {
    return async function guardar(usuarioId, body) {
        if (!usuarioId) throw new ErrorHorario(401, "Sesión inválida");
        const propuestos = validarHorarios(body?.horarios);
        if (typeof body?.revision !== "string" || !/^[a-f0-9]{64}$/.test(body.revision)) {
            throw new ErrorHorario(400, "Recarga tus horarios antes de guardar");
        }
        return db.transaction(async transaction => {
            const medico = await Medico.findOne({ where: { usuario_id: usuarioId }, transaction, lock: transaction.LOCK.UPDATE });
            if (!medico) throw new ErrorHorario(404, "No se encontró el perfil del médico");
            const existentes = (await Horario.findAll({ where: { medico_id: medico.id_medico }, transaction, lock: transaction.LOCK.UPDATE })).map(plano);
            const porId = new Map(existentes.map(h => [h.id_horario, h]));
            for (const h of propuestos) {
                if (h.id_horario !== undefined && !porId.has(h.id_horario)) throw new ErrorHorario(403, "El horario no pertenece al médico autenticado");
            }
            if (revisionHorarios(existentes) !== body.revision) throw new ErrorHorario(409, "Los horarios cambiaron. Cierra y vuelve a abrir el modal");
            const recibidos = new Map(propuestos.filter(h => h.id_horario !== undefined).map(h => [h.id_horario, h]));
            const cambios = [];
            for (const previo of existentes) {
                const nuevo = recibidos.get(previo.id_horario);
                if (!nuevo || !igual(previo, nuevo)) {
                    if (previo.estado !== "Pendiente" || previo.aprobado_por !== null) {
                        throw new ErrorHorario(409, "Los horarios aprobados o rechazados deben conservarse sin cambios");
                    }
                    cambios.push(previo);
                }
            }
            // Los rechazados se conservan como historial, pero no reservan disponibilidad.
            const activos = propuestos.filter(h => h.id_horario === undefined || porId.get(h.id_horario).estado !== "Rechazado");
            for (let i = 0; i < activos.length; i++) for (let j = i + 1; j < activos.length; j++) {
                if (solapa(activos[i], activos[j])) throw new ErrorHorario(400, "Hay franjas duplicadas o superpuestas");
            }
            if (cambios.length) {
                const actual = ahora();
                const citas = await Cita.findAll({ where: { medico_id: medico.id_medico, fecha: { [Op.gte]: actual.fecha } }, transaction, lock: transaction.LOCK.UPDATE });
                for (const cita of citas) {
                    if (cita.fecha === actual.fecha && cita.hora < actual.hora) continue;
                    const indice = (new Date(cita.fecha + "T12:00:00Z").getUTCDay() + 6) % 7;
                    if (cambios.some(h => h.dia_semana === diasSemana[indice] && h.hora_inicio <= cita.hora && cita.hora < h.hora_fin)) {
                        throw new ErrorHorario(409, "No se puede cambiar una franja con citas futuras. Requiere revisión administrativa");
                    }
                }
            }
            let creados = 0, actualizados = 0, eliminados = 0;
            for (const h of propuestos) {
                if (h.id_horario === undefined) {
                    await Horario.create({ medico_id: medico.id_medico, dia_semana: h.dia_semana, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, estado: "Pendiente", aprobado_por: null }, { transaction });
                    creados++;
                } else if (!igual(porId.get(h.id_horario), h)) {
                    const [cantidad] = await Horario.update({ dia_semana: h.dia_semana, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin }, { where: { id_horario: h.id_horario, medico_id: medico.id_medico, estado: "Pendiente", aprobado_por: null }, transaction });
                    if (cantidad !== 1) throw new ErrorHorario(409, "El horario cambió durante el guardado");
                    actualizados++;
                }
            }
            for (const h of cambios.filter(h => !recibidos.has(h.id_horario))) {
                const cantidad = await Horario.destroy({ where: { id_horario: h.id_horario, medico_id: medico.id_medico, estado: "Pendiente", aprobado_por: null }, transaction });
                if (cantidad !== 1) throw new ErrorHorario(409, "El horario cambió durante el guardado");
                eliminados++;
            }
            return { creados, actualizados, eliminados };
        });
    };
}
