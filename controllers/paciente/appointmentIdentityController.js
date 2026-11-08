import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { Cita, EstadoCita, Especialidad, Medico, Paciente } from '../../models/index.js'
import { sendAppointmentIdentityCodeEmail } from '../../services/emailService.js'
import { consultarHorasDisponiblesCita, HORAS_CITA } from '../../services/citaAvailability.js'

const verificaciones = new Map()
const estadosActivos = ['Pendiente', 'Confirmada']

const responderError = (res, status, mensaje) => res.status(status).json({ ok: false, mensaje })

const mascararCorreo = (correo) => {
    const [usuario, dominio] = String(correo || '').split('@')
    if (!usuario || !dominio) return ''
    return `${usuario.slice(0, 2)}${'*'.repeat(Math.max(usuario.length - 2, 2))}@${dominio}`
}

const obtenerDatosAccion = async (usuarioId, datos) => {
    const accion = datos.accion
    if (!['nueva', 'reprogramacion'].includes(accion)) {
        return { error: 'La acción solicitada no es válida.', status: 400 }
    }

    const paciente = await Paciente.findOne({ where: { usuario_id: usuarioId } })
    if (!paciente) return { error: 'No se encontró el perfil del paciente.', status: 404 }

    const fecha = String(datos.fecha || '')
    const hora = String(datos.hora || '')
    const medicoId = Number(datos.medicoId)
    const especialidadId = Number(datos.especialidadId)
    const citaId = datos.citaId ? Number(datos.citaId) : null

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora) ||
        !Number.isInteger(medicoId) || medicoId < 1 ||
        !Number.isInteger(especialidadId) || especialidadId < 1) {
        return { error: 'Completa una especialidad, un médico, una fecha y una hora válidos.', status: 400 }
    }

    const fechaSeleccionada = new Date(`${fecha}T00:00:00Z`)
    if (Number.isNaN(fechaSeleccionada.getTime()) || fechaSeleccionada.toISOString().slice(0, 10) !== fecha) {
        return { error: 'La fecha seleccionada no es válida.', status: 400 }
    }
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaMinima = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`
    if (fecha < fechaMinima) {
        return { error: 'Selecciona una fecha a partir de mañana.', status: 400 }
    }

    if (!HORAS_CITA.includes(hora)) {
        return { error: 'Selecciona uno de los horarios habilitados para la cita.', status: 400 }
    }

    const especialidad = await Especialidad.findByPk(especialidadId)
    const medico = await Medico.findByPk(medicoId)
    if (!especialidad || !medico || Number(medico.especialidad_id) !== especialidadId) {
        return { error: 'El médico no pertenece a la especialidad seleccionada.', status: 400 }
    }

    let cita = null
    if (accion === 'reprogramacion') {
        if (!Number.isInteger(citaId) || citaId < 1) return { error: 'La cita que deseas reprogramar no es válida.', status: 400 }
        cita = await Cita.findOne({
            where: { id_cita: citaId, paciente_id: paciente.id_paciente },
            include: [{ model: EstadoCita, as: 'Estado' }]
        })
        if (!cita) return { error: 'No se encontró esta cita para tu cuenta.', status: 404 }
        if (!estadosActivos.includes(cita.Estado?.nombre)) {
            return { error: 'Esta cita no se puede reprogramar por su estado actual.', status: 409 }
        }
    }

    const disponibilidad = await consultarHorasDisponiblesCita({
        medicoId,
        fecha,
        pacienteId: paciente.id_paciente,
        excluirCitaId: cita?.id_cita,
        anticipacionHoras: 24
    })
    if (!disponibilidad.horas.includes(hora)) {
        return { error: disponibilidad.mensaje || 'La hora seleccionada ya no está disponible.', status: 409 }
    }

    return {
        accion,
        paciente,
        cita,
        datos: { fecha, hora, medicoId, especialidadId, citaId }
    }
}

export const solicitarCodigoCitaPaciente = async (req, res) => {
    const usuarioId = req.usuario.id_usuario
    const clave = String(usuarioId)
    try {
        const anterior = verificaciones.get(clave)
        if (anterior && anterior.expiraEn > Date.now() && Date.now() - anterior.enviadoEn < 60_000) {
            return responderError(res, 429, 'Espera un minuto antes de solicitar otro código.')
        }

        const accionValidada = await obtenerDatosAccion(usuarioId, req.body)
        if (accionValidada.error) return responderError(res, accionValidada.status, accionValidada.error)

        const { accion, datos } = accionValidada
        const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0')
        const citaCorreo = { fecha: datos.fecha, hora: datos.hora }
        await sendAppointmentIdentityCodeEmail(req.usuario, codigo, accion === 'nueva' ? 'nueva' : 'reprogramacion', citaCorreo)

        const codigoHash = createHmac('sha256', process.env.JWT_SECRET)
            .update(`${usuarioId}:${accion}:${codigo}`)
            .digest('hex')
        verificaciones.set(clave, {
            accion,
            datos,
            codigoHash,
            enviadoEn: Date.now(),
            expiraEn: Date.now() + 10 * 60 * 1000,
            intentos: 0
        })

        return res.json({ ok: true, correo: mascararCorreo(req.usuario.correo) })
    } catch (error) {
        console.error('Error al solicitar código para la cita:', {
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            message: error.message
        })
        return responderError(res, 503, 'No se pudo enviar el código. Revisa la conexión SMTP e inténtalo nuevamente.')
    }
}

export const listarHorasDisponiblesCitaPaciente = async (req, res) => {
    try {
        const medicoId = Number(req.query.medicoId)
        const fecha = String(req.query.fecha || '')
        if (!Number.isInteger(medicoId) || medicoId < 1 || !fecha) {
            return responderError(res, 400, 'Selecciona médico y fecha para consultar los horarios.')
        }
        const medico = await Medico.findByPk(medicoId)
        if (!medico) return responderError(res, 404, 'No se encontró el médico seleccionado.')

        const paciente = await Paciente.findOne({ where: { usuario_id: req.usuario.id_usuario } })
        if (!paciente) return responderError(res, 404, 'No se encontró el perfil del paciente.')

        let excluirCitaId = null
        if (req.query.citaId) {
            excluirCitaId = Number(req.query.citaId)
            if (!Number.isInteger(excluirCitaId) || excluirCitaId < 1) {
                return responderError(res, 400, 'La cita seleccionada no es válida.')
            }
            const cita = await Cita.findOne({
                where: { id_cita: excluirCitaId, paciente_id: paciente.id_paciente },
                include: [{ model: EstadoCita, as: 'Estado' }]
            })
            if (!cita || !estadosActivos.includes(cita.Estado?.nombre)) {
                return responderError(res, 404, 'No se encontró una cita activa para reprogramar.')
            }
        }

        const disponibilidad = await consultarHorasDisponiblesCita({
            medicoId,
            fecha,
            pacienteId: paciente.id_paciente,
            excluirCitaId,
            anticipacionHoras: 24
        })
        return res.json({ ok: true, horas: disponibilidad.horas, mensaje: disponibilidad.mensaje })
    } catch (error) {
        console.error('Error al consultar horarios del paciente:', error)
        return responderError(res, 500, 'No fue posible consultar los horarios disponibles.')
    }
}

export const verificarCodigoCitaPaciente = async (req, res) => {
    const usuarioId = req.usuario.id_usuario
    const clave = String(usuarioId)
    const verificacion = verificaciones.get(clave)
    if (!verificacion || verificacion.expiraEn <= Date.now()) {
        verificaciones.delete(clave)
        return responderError(res, 400, 'El código venció o no existe. Solicita uno nuevo.')
    }
    if (verificacion.intentos >= 5) {
        verificaciones.delete(clave)
        return responderError(res, 429, 'Se excedió el máximo de intentos. Solicita un código nuevo.')
    }

    const codigo = String(req.body.codigo || '').trim()
    const codigoHash = createHmac('sha256', process.env.JWT_SECRET)
        .update(`${usuarioId}:${verificacion.accion}:${codigo}`)
        .digest('hex')
    const valido = /^\d{6}$/.test(codigo) && timingSafeEqual(
        Buffer.from(verificacion.codigoHash, 'hex'),
        Buffer.from(codigoHash, 'hex')
    )
    if (!valido) {
        verificacion.intentos += 1
        return responderError(res, 400, 'El código ingresado no es correcto.')
    }

    try {
        const accionValidada = await obtenerDatosAccion(usuarioId, {
            accion: verificacion.accion,
            ...verificacion.datos
        })
        if (accionValidada.error) {
            verificaciones.delete(clave)
            return responderError(res, accionValidada.status, accionValidada.error)
        }

        const { accion, paciente, cita, datos } = accionValidada
        if (accion === 'nueva') {
            const estadoPendiente = await EstadoCita.findOne({ where: { nombre: 'Pendiente' } })
            if (!estadoPendiente) return responderError(res, 500, 'No está configurado el estado Pendiente.')
            const nuevaCita = await Cita.create({
                paciente_id: paciente.id_paciente,
                medico_id: datos.medicoId,
                estado_id: estadoPendiente.id_estado,
                creado_por: usuarioId,
                fecha: datos.fecha,
                hora: `${datos.hora}:00`
            })
            verificaciones.delete(clave)
            return res.json({ ok: true, mensaje: 'La cita quedó registrada.', citaId: nuevaCita.id_cita })
        }

        await cita.update({
            medico_id: datos.medicoId,
            fecha: datos.fecha,
            hora: `${datos.hora}:00`,
            reprogramado_por: usuarioId,
            fecha_reprogramacion: new Date(),
            motivo_reprogramacion: 'Reprogramación solicitada por el paciente y confirmada por correo.'
        })
        verificaciones.delete(clave)
        return res.json({ ok: true, mensaje: 'La cita fue reprogramada.' })
    } catch (error) {
        console.error('Error al aplicar la acción de cita verificada:', error)
        return responderError(res, 500, 'No fue posible guardar la cita. Inténtalo nuevamente.')
    }
}

export const cancelarCodigoCitaPaciente = (req, res) => {
    verificaciones.delete(String(req.usuario.id_usuario))
    return res.json({ ok: true })
}
