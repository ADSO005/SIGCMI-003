import { Op } from 'sequelize';
import { Cita, EstadoCita, Paciente, Usuario } from '../../models/index.js';
import ConfiguracionNotificacion from '../../models/ConfiguracionNotificacion.js';
import { enqueueNotification, processNotificationQueue } from './notificationQueue.js';

const MINUTO = 60_000;

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
        await enqueueNotification({ clave, evento: tipo, citaId: cita.id_cita, usuarioId: usuario.id_usuario, fecha: cita.fecha, hora: cita.hora });
    }
}

export function startAppointmentReminders() {
    let ejecutando = false;
    const ejecutar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try {
            await processAppointmentReminders();
            await processNotificationQueue();
        }
        catch (error) { console.error('No se pudieron procesar notificaciones:', { message: error.message }); }
        finally { ejecutando = false; }
    };
    void ejecutar();
    const timer = setInterval(ejecutar, 5 * MINUTO);
    timer.unref();
    return timer;
}
