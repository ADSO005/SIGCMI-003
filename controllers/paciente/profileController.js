import bcrypt from 'bcrypt'
import { Paciente } from '../../models/index.js'

const obtenerDatosFormulario = (usuario, paciente, body = {}) => ({
    nombres: body.nombres ?? usuario.nombres ?? '',
    apellidos: body.apellidos ?? usuario.apellidos ?? '',
    correo: body.correo ?? usuario.correo ?? '',
    telefono: body.telefono ?? usuario.telefono ?? '',
    fechaNacimiento: body.fechaNacimiento ?? paciente.fecha_nacimiento ?? '',
    tipoDocumento: usuario.tipo_documento ?? '',
    numeroDocumento: usuario.numero_documento ?? '',
    tipoSangre: body.tipoSangre ?? paciente.tipo_sangre ?? '',
    alergias: body.alergias ?? paciente.alergias ?? '',
    condicionesMedicas: body.condicionesMedicas ?? paciente.condiciones_medicas ?? '',
    direccion: body.direccion ?? paciente.direccion ?? '',
    departamento: body.departamento ?? paciente.departamento ?? '',
    ciudad: body.ciudad ?? paciente.ciudad ?? ''
})

const renderizarFormulario = (req, res, opciones = {}) => {
    const paciente = req.pacientePerfil
    res.render('viewsPaciente/editProfile', {
        pagina: 'Editar Perfil',
        paciente: obtenerDatosFormulario(req.usuario, paciente, opciones.formData),
        mensajeExito: opciones.mensajeExito || null,
        errorContrasena: opciones.errorContrasena || null,
        abrirModal: Boolean(opciones.abrirModal)
    })
}

export const mostrarEdicionPerfil = async (req, res) => {
    try {
        const paciente = await Paciente.findOne({
            where: { usuario_id: req.usuario.id_usuario }
        })

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
        const paciente = await Paciente.findOne({
            where: { usuario_id: req.usuario.id_usuario }
        })

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
                fecha_nacimiento: req.body.fechaNacimiento || null,
                tipo_sangre: req.body.tipoSangre || null,
                alergias: String(req.body.alergias || '').trim() || null,
                condiciones_medicas: String(req.body.condicionesMedicas || '').trim() || null,
                direccion: String(req.body.direccion || '').trim() || null,
                departamento: String(req.body.departamento || '').trim() || null,
                ciudad: String(req.body.ciudad || '').trim() || null
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
