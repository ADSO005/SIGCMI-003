import ConfiguracionNotificacion from '../../models/ConfiguracionNotificacion.js'
import { sendAppointmentNotificationEmail } from '../emailService.js'

// La ausencia de configuración sigue los valores predeterminados del modelo.
export async function notifyPatientAppointment(usuario, cita, tipo) {
    try {
        const configuracion = await ConfiguracionNotificacion.findOne({ where: { usuario_id: usuario.id_usuario } })
        if (configuracion && (!configuracion.correo || !configuracion[tipo])) return
        await sendAppointmentNotificationEmail(usuario, cita, tipo)
    } catch (error) {
        console.error('No se pudo enviar la notificación de cita:', { code: error.code, message: error.message })
    }
}
