import { randomBytes } from 'node:crypto';
import { Op, QueryTypes } from 'sequelize';
import db from '../../config/db.js';
import { Cita, EstadoCita, Paciente, Usuario, Diagnostico } from '../../models/index.js';
import ConfiguracionNotificacion from '../../models/ConfiguracionNotificacion.js';
import { sendAppointmentNotificationEmail, sendDiagnosisNotificationEmail } from '../emailService.js';

const EVENTOS = new Set(['recordatorio_24h', 'recordatorio_1h', 'nuevo_diagnostico']);
const MINUTO = 60_000;

// The unique event key and queue index make replays safe; the caller may supply its transaction.
export async function enqueueNotification({ clave, evento, citaId, usuarioId, fecha, hora }, transaction) {
    if (!EVENTOS.has(evento)) throw new Error('Evento de notificación no permitido.');
    const work = async (tx) => {
        await db.query('INSERT IGNORE INTO notificaciones (usuario_id, enviado_por, titulo, mensaje, canal, fecha_envio, estado, tipo, clave_evento, evento, cita_id, fecha_cita, hora_cita) VALUES (?, NULL, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)', {
            replacements: [usuarioId, 'Aviso de SIGCMI', 'Aviso disponible en SIGCMI', 'Correo', 'Pendiente', 'Automatica', clave, evento, citaId, fecha || null, hora || null], transaction: tx
        });
        const rows = await db.query('SELECT id_notificacion FROM notificaciones WHERE clave_evento = ? FOR UPDATE', { replacements: [clave], type: QueryTypes.SELECT, transaction: tx });
        if (!rows.length) throw new Error('No se pudo registrar la notificación.');
        await db.query('INSERT IGNORE INTO cola_notificaciones (notificacion_id, prioridad, estado, intentos, fecha_programada, actualizado) VALUES (?, 1, ?, ?, ?, ?)', { replacements: [rows[0].id_notificacion, 'Pendiente', 0, new Date(), new Date()], transaction: tx });
    };
    return transaction ? work(transaction) : db.transaction(work);
}

export async function processNotificationQueue() {
    const stale = new Date(Date.now() - 2 * MINUTO);
    // Recover the terminal state if a worker stopped during its final attempt.
    await db.query("UPDATE notificaciones n JOIN cola_notificaciones c ON c.notificacion_id=n.id_notificacion SET n.estado='Error', n.error_envio='No fue posible confirmar el envío después de cinco intentos.', c.estado='Error', c.lease_token=NULL, c.actualizado=? WHERE n.evento IN ('recordatorio_24h','recordatorio_1h','nuevo_diagnostico') AND c.estado='Procesando' AND c.intentos>=5 AND c.actualizado < ?", { replacements: [new Date(), stale] });
    const items = await db.query("SELECT c.id_cola, n.id_notificacion, n.clave_evento, n.evento, n.cita_id, n.usuario_id, DATE_FORMAT(n.fecha_cita, '%Y-%m-%d') AS fecha_cita, n.hora_cita FROM cola_notificaciones c JOIN notificaciones n ON n.id_notificacion=c.notificacion_id WHERE n.evento IN ('recordatorio_24h','recordatorio_1h','nuevo_diagnostico') AND c.intentos < 5 AND (c.fecha_programada IS NULL OR c.fecha_programada <= ?) AND (c.estado='Pendiente' OR (c.estado='Procesando' AND c.actualizado < ?)) ORDER BY c.fecha_programada LIMIT 50", { replacements: [new Date(), stale], type: QueryTypes.SELECT });
    for (const item of items) {
        const lease = randomBytes(8).toString('hex');
        const [, changed] = await db.query("UPDATE cola_notificaciones SET estado='Procesando', lease_token=?, actualizado=?, intentos=intentos+1 WHERE id_cola=? AND intentos<5 AND (estado='Pendiente' OR (estado='Procesando' AND actualizado < ?))", { replacements: [lease, new Date(), item.id_cola, stale] });
        if (!changed?.affectedRows) continue;
        try {
            const diagnosis = item.evento === 'nuevo_diagnostico';
            const include = [
                { model: EstadoCita, as: 'Estado', required: true, where: { nombre: diagnosis ? 'Completada' : { [Op.in]: ['Pendiente', 'Confirmada'] } } },
                { model: Paciente, required: true, include: [{ model: Usuario, required: true, where: { id_usuario: item.usuario_id } }] }
            ];
            if (diagnosis) include.push({ model: Diagnostico, as: 'Diagnostico', required: true, attributes: ['id_diagnostico'] });
            const cita = await Cita.findOne({ where: { id_cita: item.cita_id }, include });
            const usuario = cita?.Paciente?.Usuario;
            const preferences = usuario && await ConfiguracionNotificacion.findOne({ where: { usuario_id: usuario.id_usuario } });
            const allowed = usuario?.correo && usuario.estado && (!preferences || (preferences.correo && preferences[item.evento]));
            const current = diagnosis || (cita && String(cita.fecha) === String(item.fecha_cita) && String(cita.hora).slice(0,5) === String(item.hora_cita).slice(0,5) && reminderType(cita.fecha, cita.hora) === item.evento);
            if (allowed && current) {
                if (diagnosis) await sendDiagnosisNotificationEmail(usuario, item.clave_evento);
                else await sendAppointmentNotificationEmail(usuario, cita, item.evento, item.clave_evento);
            }
            await db.transaction(async tx => {
                const [, updated] = await db.query("UPDATE cola_notificaciones SET estado=?, fecha_proceso=?, actualizado=?, lease_token=NULL WHERE id_cola=? AND lease_token=?", { replacements: [allowed && current ? 'Enviada' : 'Omitida', new Date(), new Date(), item.id_cola, lease], transaction: tx });
                if (updated?.affectedRows) await db.query('UPDATE notificaciones SET estado=?, fecha_envio=?, error_envio=? WHERE id_notificacion=?', { replacements: [allowed && current ? 'Enviada' : 'Omitida', allowed && current ? new Date() : null, allowed && current ? null : 'Aviso omitido por estado o preferencias.', item.id_notificacion], transaction: tx });
            });
        } catch (error) {
            await db.transaction(async tx => {
                const [, updated] = await db.query("UPDATE cola_notificaciones SET estado=IF(intentos>=5,'Error','Pendiente'), lease_token=NULL, actualizado=? WHERE id_cola=? AND lease_token=?", { replacements: [new Date(), item.id_cola, lease], transaction: tx });
                if (updated?.affectedRows) await db.query("UPDATE notificaciones n JOIN cola_notificaciones c ON c.notificacion_id=n.id_notificacion SET n.estado='Error', n.error_envio='No fue posible enviar el correo después de cinco intentos.' WHERE c.id_cola=? AND c.estado='Error'", { replacements: [item.id_cola], transaction: tx });
            });
            console.error('No se pudo procesar una notificación:', { code: error.code, message: error.message });
        }
    }
}

import { reminderType } from './appointmentReminders.js';
