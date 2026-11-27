import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import db from '../../config/db.js';
import { Cita, EstadoCita, Paciente, Usuario } from '../../models/index.js';
import ConfiguracionNotificacion from '../../models/ConfiguracionNotificacion.js';
import { sendAppointmentNotificationEmail } from '../emailService.js';

const MINUTO = 60_000;
const MAX_INTENTOS = 5;

export function reminderType(fecha, hora, ahora = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(hora))) return null;
    const instante = Date.parse(`${fecha}T${String(hora).slice(0, 5)}:00-05:00`);
    const restante = instante - ahora.getTime();
    if (restante <= 0 || restante > 24 * 60 * MINUTO) return null;
    return restante <= 60 * MINUTO ? 'recordatorio_1h' : 'recordatorio_24h';
}

export async function processAppointmentReminders(ahora = new Date()) {
    const inicio = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
    const fin = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ahora.getTime() + 24 * 60 * MINUTO));
    const citas = await Cita.findAll({
        where: { fecha: { [Op.between]: [inicio, fin] } },
        include: [
            { model: EstadoCita, as: 'Estado', required: true, where: { nombre: { [Op.in]: ['Pendiente', 'Confirmada'] } } },
            { model: Paciente, required: true, include: [{ model: Usuario, required: true }] }
        ]
    });
    for (const cita of citas) {
        const tipo = reminderType(cita.fecha, cita.hora, ahora);
        const usuario = cita.Paciente?.Usuario;
        if (!tipo || !usuario?.correo) continue;
        const preferencias = await ConfiguracionNotificacion.findOne({ where: { usuario_id: usuario.id_usuario } });
        if (preferencias && (!preferencias.correo || !preferencias[tipo])) continue;

        const clave = `cita-${cita.id_cita}-${cita.fecha}-${String(cita.hora).slice(0, 5).replace(':', '')}-${tipo}`;
        const token = randomBytes(8).toString('hex');
        const limite = new Date(Date.now() - 2 * MINUTO);
        await db.query('INSERT IGNORE INTO recordatorios_cita (clave, estado, intentos, actualizado) VALUES (?, ?, 0, ?)', { replacements: [clave, 'pendiente', new Date()] });
        const [, metadata] = await db.query('UPDATE recordatorios_cita SET estado = ?, intentos = intentos + 1, actualizado = ? WHERE clave = ? AND intentos < ? AND (estado = ? OR (estado <> ? AND actualizado < ?))', { replacements: [token, new Date(), clave, MAX_INTENTOS, 'pendiente', 'enviado', limite] });
        if (!metadata?.affectedRows) continue;
        try {
            const vigente = await Cita.findOne({ where: { id_cita: cita.id_cita, fecha: cita.fecha, hora: cita.hora }, include: [{ model: EstadoCita, as: 'Estado', required: true, where: { nombre: { [Op.in]: ['Pendiente', 'Confirmada'] } } }] });
            const actual = await ConfiguracionNotificacion.findOne({ where: { usuario_id: usuario.id_usuario } });
            if (vigente && (!actual || (actual.correo && actual[tipo])) && reminderType(vigente.fecha, vigente.hora) === tipo) {
                await sendAppointmentNotificationEmail(usuario, vigente, tipo, clave);
            }
            await db.query('UPDATE recordatorios_cita SET estado = ?, actualizado = ? WHERE clave = ? AND estado = ?', { replacements: ['enviado', new Date(), clave, token] });
        } catch (error) {
            await db.query('UPDATE recordatorios_cita SET estado = ?, actualizado = ? WHERE clave = ? AND estado = ?', { replacements: ['pendiente', new Date(), clave, token] });
            console.error('No se pudo enviar un recordatorio:', { code: error.code, message: error.message });
        }
    }
}

export function startAppointmentReminders() {
    let ejecutando = false;
    const ejecutar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try { await processAppointmentReminders(); }
        catch (error) { console.error('No se pudieron procesar recordatorios:', { code: error.code, message: error.message }); }
        finally { ejecutando = false; }
    };
    void ejecutar();
    const timer = setInterval(ejecutar, 5 * MINUTO);
    timer.unref();
    return timer;
}
