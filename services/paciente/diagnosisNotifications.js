import Paciente from '../../models/Paciente.js';
import { enqueueNotification } from './notificationQueue.js';

export async function enqueueDiagnosisNotification(cita, transaction) {
    const paciente = await Paciente.findByPk(cita.paciente_id, { transaction });
    if (!paciente) throw new Error('No se encontró el paciente de la cita.');
    await enqueueNotification({ clave: `diagnostico-${cita.id_cita}`, evento: 'nuevo_diagnostico', citaId: cita.id_cita, usuarioId: paciente.usuario_id }, transaction);
}
