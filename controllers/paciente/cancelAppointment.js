import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { Paciente, Cita, EstadoCita } from '../../models/index.js'
import { sendCancellationCodeEmail } from '../../services/emailService.js'

const verificacionesCancelacion = new Map()
const ESTADOS_CANCELABLES = ['Pendiente', 'Confirmada']

const obtenerCitaPaciente = async (idCita, usuarioId) => {
    if (!/^\d+$/.test(String(idCita))) return { paciente: null, cita: null }

    const paciente = await Paciente.findOne({ where: { usuario_id: usuarioId } })
    if (!paciente) return { paciente: null, cita: null }

    const cita = await Cita.findOne({
        where: { id_cita: idCita, paciente_id: paciente.id_paciente },
        include: [{ model: EstadoCita, as: 'Estado' }]
    })

    return { paciente, cita }
}

const renderCorreo = (res, cita, correo = '', error = null, status = 200) =>
    res.status(status).render('viewsPaciente/cancelAppointmentEmail', {
        tituloPagina: 'Confirmar identidad', cita, correo, error
    })

const renderCodigo = (res, cita, correo, error = null, status = 200) =>
    res.status(status).render('viewsPaciente/verifyAppointmentCancellation', {
        tituloPagina: 'Verificar código', cita, correo, error
    })

const mostrarFormularioCancelacion = async (req, res) => {
    try {
        const { cita } = await obtenerCitaPaciente(req.params.id, req.usuario.id_usuario)
        if (!cita) return res.status(404).send('No se encontró esta cita para tu cuenta.')

        if (!ESTADOS_CANCELABLES.includes(cita.Estado?.nombre)) {
            return res.status(400).send('Esta cita no se puede cancelar por su estado actual.')
        }

        return renderCorreo(res, cita)
    } catch (error) {
        console.error('Error al iniciar la cancelación de la cita:', error)
        return res.status(500).send('No fue posible iniciar la cancelación.')
    }
}

const solicitarCodigoCancelacion = async (req, res) => {
    try {
        const { cita } = await obtenerCitaPaciente(req.params.id, req.usuario.id_usuario)
        if (!cita) return res.status(404).send('No se encontró esta cita para tu cuenta.')

        if (!ESTADOS_CANCELABLES.includes(cita.Estado?.nombre)) {
            return res.status(400).send('Esta cita no se puede cancelar por su estado actual.')
        }

        const correoIngresado = String(req.body.correo || '').trim().toLowerCase()
        const correoRegistrado = String(req.usuario.correo || '').trim().toLowerCase()
        if (!correoIngresado || correoIngresado !== correoRegistrado) {
            return renderCorreo(
                res,
                cita,
                '',
                'El correo no coincide con el correo registrado en tu cuenta.',
                400
            )
        }

        const llave = `${req.usuario.id_usuario}:${cita.id_cita}`
        const verificacionAnterior = verificacionesCancelacion.get(llave)
        if (verificacionAnterior && verificacionAnterior.expiraEn <= Date.now()) {
            verificacionesCancelacion.delete(llave)
        }
        if (verificacionAnterior && verificacionAnterior.expiraEn > Date.now() && verificacionAnterior.intentos >= 5) {
            return renderCorreo(
                res,
                cita,
                correoIngresado,
                'Se excedió el máximo de intentos. Espera a que venza el código e inténtalo de nuevo.',
                429
            )
        }
        if (verificacionAnterior && Date.now() - verificacionAnterior.enviadoEn < 60_000) {
            return renderCorreo(
                res,
                cita,
                correoIngresado,
                'Espera un minuto antes de solicitar otro código.',
                429
            )
        }

        const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0')
        await sendCancellationCodeEmail(req.usuario, codigo, cita)

        const codigoHash = createHmac('sha256', process.env.JWT_SECRET)
            .update(`${req.usuario.id_usuario}:${cita.id_cita}:${codigo}`)
            .digest('hex')

        verificacionesCancelacion.set(llave, {
            codigoHash,
            expiraEn: Date.now() + 10 * 60 * 1000,
            enviadoEn: Date.now(),
            intentos: 0
        })

        return renderCodigo(res, cita, correoIngresado)
    } catch (error) {
        console.error('Error al enviar el código de cancelación:', error)
        return res.status(500).send('No fue posible enviar el código. Inténtalo más tarde.')
    }
}

const verificarCodigoCancelacion = async (req, res) => {
    try {
        const llave = `${req.usuario.id_usuario}:${req.params.id}`
        const verificacion = verificacionesCancelacion.get(llave)
        const { cita } = await obtenerCitaPaciente(req.params.id, req.usuario.id_usuario)

        if (!cita) return res.status(404).send('No se encontró esta cita para tu cuenta.')
        if (!verificacion || verificacion.expiraEn <= Date.now()) {
            verificacionesCancelacion.delete(llave)
            return renderCodigo(
                res,
                cita,
                req.usuario.correo,
                'El código venció o no existe. Solicita uno nuevo.',
                400
            )
        }

        if (verificacion.intentos >= 5) {
            return renderCorreo(
                res,
                cita,
                '',
                'Se excedió el máximo de intentos. Espera a que venza el código e inténtalo de nuevo.',
                429
            )
        }

        const codigoIngresado = String(req.body.codigo || '').trim()
        const codigoHashIngresado = createHmac('sha256', process.env.JWT_SECRET)
            .update(`${req.usuario.id_usuario}:${cita.id_cita}:${codigoIngresado}`)
            .digest('hex')
        const coincide = /^\d{6}$/.test(codigoIngresado) && timingSafeEqual(
            Buffer.from(verificacion.codigoHash, 'hex'),
            Buffer.from(codigoHashIngresado, 'hex')
        )

        if (!coincide) {
            verificacion.intentos += 1
            return renderCodigo(
                res,
                cita,
                req.usuario.correo,
                verificacion.intentos >= 5
                    ? 'Se excedió el máximo de intentos. Espera a que venza el código e inténtalo de nuevo.'
                    : 'El código ingresado no es correcto.',
                400
            )
        }

        if (!ESTADOS_CANCELABLES.includes(cita.Estado?.nombre)) {
            verificacionesCancelacion.delete(llave)
            return res.status(400).send('Esta cita ya no se puede cancelar por su estado actual.')
        }

        const estadoCancelada = await EstadoCita.findOne({ where: { nombre: 'Cancelada' } })
        if (!estadoCancelada) return res.status(500).send("No está configurado el estado 'Cancelada'.")

        cita.estado_id = estadoCancelada.id_estado
        cita.cancelado_por = req.usuario.id_usuario
        cita.fecha_cancelacion = new Date()
        cita.motivo_cancelacion = 'Cancelación solicitada por el paciente y confirmada por correo.'
        await cita.save()

        verificacionesCancelacion.delete(llave)
        return res.redirect('/paciente/dashboard')
    } catch (error) {
        console.error('Error al confirmar la cancelación de la cita:', error)
        return res.status(500).send('No fue posible confirmar la cancelación.')
    }
}

export {
    mostrarFormularioCancelacion,
    solicitarCodigoCancelacion,
    verificarCodigoCancelacion
}
