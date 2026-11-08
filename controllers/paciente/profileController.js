import bcrypt from 'bcrypt'
import { Paciente } from '../../models/index.js'

export const obtenerOCrearPerfilPaciente = async (usuarioId) => {
    const [paciente] = await Paciente.findOrCreate({
        where: { usuario_id: usuarioId },
        defaults: { usuario_id: usuarioId }
    })

    return paciente
}

const obtenerDatosFormulario = (usuario, paciente, body = {}) => ({
    nombres: body.nombres ?? usuario.nombres ?? '',
    apellidos: body.apellidos ?? usuario.apellidos ?? '',
    correo: body.correo ?? usuario.correo ?? '',
    telefono: body.telefono ?? usuario.telefono ?? '',
    fechaNacimiento: paciente.fecha_nacimiento ?? '',
    tipoDocumento: usuario.tipo_documento ?? '',
    numeroDocumento: usuario.numero_documento ?? '',
    tipoSangre: body.tipoSangre ?? paciente.tipo_sangre ?? '',
    alergias: body.alergias ?? paciente.alergias ?? '',
    condicionesMedicas: body.condicionesMedicas ?? paciente.condiciones_medicas ?? '',
    direccion: body.direccion ?? paciente.direccion ?? '',
    departamento: body.departamento ?? paciente.departamento ?? '',
    ciudad: body.ciudad ?? paciente.ciudad ?? '',
    contactoEmergencia: {
        nombres: body.contactoNombres ?? paciente.contacto_emergencia_nombres ?? '',
        apellidos: body.contactoApellidos ?? paciente.contacto_emergencia_apellidos ?? '',
        telefono: body.contactoTelefono ?? paciente.contacto_emergencia_telefono ?? '',
        correo: body.contactoCorreo ?? paciente.contacto_emergencia_correo ?? ''
    }
})

const renderizarFormulario = (req, res, opciones = {}) => {
    const paciente = req.pacientePerfil
    res.render('viewsPaciente/editProfile', {
        pagina: 'Editar Perfil',
        paciente: obtenerDatosFormulario(req.usuario, paciente, opciones.formData),
        mensajeExito: opciones.mensajeExito || null,
        mensajePassword: opciones.mensajePassword || null,
        errorPassword: opciones.errorPassword || null,
        errorContrasena: opciones.errorContrasena || null,
        abrirModal: Boolean(opciones.abrirModal),
        abrirSeccionPassword: Boolean(opciones.abrirSeccionPassword)
    })
}

export const cambiarContrasenaPaciente = async (req, res) => {
    try {
        const paciente = await obtenerOCrearPerfilPaciente(req.usuario.id_usuario)
        req.pacientePerfil = paciente

        const renderizarErrorPassword = (status, errorPassword) => {
            res.status(status)
            return renderizarFormulario(req, res, { errorPassword, abrirSeccionPassword: true })
        }

        const passwordActual = String(req.body.passwordActual || '')
        const passwordNueva = String(req.body.passwordNueva || '')
        const confirmarPassword = String(req.body.confirmarPassword || '')

        if (!passwordActual || !passwordNueva || !confirmarPassword) {
            return renderizarErrorPassword(400, 'Completa los tres campos para cambiar la contrase\u00f1a.')
        }

        const passwordActualCorrecta = await bcrypt.compare(passwordActual, req.usuario.password)
        if (!passwordActualCorrecta) {
            return renderizarErrorPassword(401, 'La contrase\u00f1a actual no es correcta.')
        }

        if (passwordNueva !== confirmarPassword) {
            return renderizarErrorPassword(400, 'La nueva contrase\u00f1a y su confirmaci\u00f3n no coinciden.')
        }

        const passwordValida = passwordNueva.length >= 6 &&
            /[A-Za-z]/.test(passwordNueva) &&
            /\d/.test(passwordNueva) &&
            /[^A-Za-z\d]/.test(passwordNueva)

        if (!passwordValida) {
            return renderizarErrorPassword(400, 'Usa al menos 6 caracteres con letras, n\u00fameros y un car\u00e1cter especial.')
        }

        if (await bcrypt.compare(passwordNueva, req.usuario.password)) {
            return renderizarErrorPassword(400, 'La nueva contrase\u00f1a debe ser diferente a la actual.')
        }

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(passwordNueva, salt)
        await req.usuario.update({ password: passwordHash })

        return renderizarFormulario(req, res, {
            mensajePassword: 'Tu contrase\u00f1a se actualiz\u00f3 correctamente.',
            abrirSeccionPassword: true
        })
    } catch (error) {
        console.error('Error al cambiar la contrase\u00f1a del paciente:', error)
        return res.status(500).send('No fue posible actualizar la contrase\u00f1a.')
    }
}
export const mostrarEdicionPerfil = async (req, res) => {
    try {
        const paciente = await obtenerOCrearPerfilPaciente(req.usuario.id_usuario)

        if (!paciente) return res.status(404).send('No se encontró el perfil del paciente.')

        req.pacientePerfil = paciente
        renderizarFormulario(req, res)
    } catch (error) {
        console.error('Error al cargar la edición del perfil:', error)
        res.status(500).send('Error al cargar el formulario de edición.')
    }
}

export const guardarEdicionPerfil = async (req, res) => {
    try {
        const paciente = await obtenerOCrearPerfilPaciente(req.usuario.id_usuario)

        if (!paciente) return res.status(404).send('No se encontró el perfil del paciente.')

        req.pacientePerfil = paciente
        const passwordConfirmacion = req.body.passwordConfirmacion || ''
        const contrasenaCorrecta = passwordConfirmacion &&
            await bcrypt.compare(passwordConfirmacion, req.usuario.password)

        if (!contrasenaCorrecta) {
            return res.status(401).render('viewsPaciente/editProfile', {
                pagina: 'Editar Perfil',
                paciente: obtenerDatosFormulario(req.usuario, paciente, req.body),
                mensajeExito: null,
                errorContrasena: 'La contraseña es incorrecta. Inténtalo nuevamente.',
                abrirModal: true
            })
        }

        const usuarioActualizado = {
            nombres: String(req.body.nombres || '').trim(),
            apellidos: String(req.body.apellidos || '').trim(),
            correo: String(req.body.correo || '').trim(),
            telefono: String(req.body.telefono || '').trim() || null
        }

        if (!usuarioActualizado.nombres || !usuarioActualizado.apellidos || !usuarioActualizado.correo) {
            return res.status(400).render('viewsPaciente/editProfile', {
                pagina: 'Editar Perfil',
                paciente: obtenerDatosFormulario(req.usuario, paciente, req.body),
                mensajeExito: null,
                errorContrasena: 'Completa nombres, apellidos y correo para guardar los cambios.',
                abrirModal: true
            })
        }

        await req.usuario.sequelize.transaction(async (transaction) => {
            await req.usuario.update(usuarioActualizado, { transaction })
            await paciente.update({
                tipo_sangre: req.body.tipoSangre || null,
                alergias: String(req.body.alergias || '').trim() || null,
                condiciones_medicas: String(req.body.condicionesMedicas || '').trim() || null,
                direccion: String(req.body.direccion || '').trim() || null,
                departamento: String(req.body.departamento || '').trim() || null,
                ciudad: String(req.body.ciudad || '').trim() || null,
                contacto_emergencia_nombres: String(req.body.contactoNombres || '').trim() || null,
                contacto_emergencia_apellidos: String(req.body.contactoApellidos || '').trim() || null,
                contacto_emergencia_telefono: String(req.body.contactoTelefono || '').trim() || null,
                contacto_emergencia_correo: String(req.body.contactoCorreo || '').trim() || null
            }, { transaction })
        })

        const pacienteActualizado = await Paciente.findOne({
            where: { usuario_id: req.usuario.id_usuario }
        })
        req.pacientePerfil = pacienteActualizado
        Object.assign(req.usuario, usuarioActualizado)
        return renderizarFormulario(req, res, {
            mensajeExito: 'La edición de tus datos se realizó correctamente.'
        })
    } catch (error) {
        console.error('Error al guardar la edición del perfil:', error)
        if (error.name === 'SequelizeUniqueConstraintError') {
            const paciente = await Paciente.findOne({
                where: { usuario_id: req.usuario.id_usuario }
            })
            return res.status(409).render('viewsPaciente/editProfile', {
                pagina: 'Editar Perfil',
                paciente: obtenerDatosFormulario(req.usuario, paciente, req.body),
                mensajeExito: null,
                errorContrasena: 'Ese correo ya está registrado en otra cuenta.',
                abrirModal: true
            })
        }
        res.status(500).send('No fue posible guardar los cambios del perfil.')
    }
}
