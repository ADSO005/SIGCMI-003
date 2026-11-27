import { notificar } from '../notificaciones/notificar.js'

// Los avisos de cita pasan por el servicio central (correo + WhatsApp según preferencias).
export async function notifyPatientAppointment(usuario, cita, tipo) {
    try {
        await notificar(usuario, cita, tipo)
    } catch (error) {
        console.error('No se pudo enviar la notificación de cita:', { code: error.code, message: error.message })
    }
}
