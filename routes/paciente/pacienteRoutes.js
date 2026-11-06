import express from "express";
import auth from '../../middleware/auth.js'
import role from '../../middleware/role.js'

import {
    obtenerHistorialDiagnosticos,
    listarConfiguracionNotificaciones,
    actualizarConfiguracionNotificaciones
} from "../../controllers/paciente/controller.js";
import { Usuario, Cita, Medico, Especialidad, EstadoCita } from '../../models/index.js'
import { mostrarFormularioCancelacion, solicitarCodigoCancelacion, verificarCodigoCancelacion } from '../../controllers/paciente/cancelAppointment.js'
import { mostrarEdicionPerfil, guardarEdicionPerfil, cambiarContrasenaPaciente, obtenerOCrearPerfilPaciente } from '../../controllers/paciente/profileController.js'


const router = express.Router()
// ======================================================
// VISTA: PERFIL DEL PACIENTE (GET /paciente/perfil)
// ======================================================
router.get('/perfil', auth, role(3), async (req, res) => {
    try {
        const pacienteDB = await obtenerOCrearPerfilPaciente(req.usuario.id_usuario)

        if (!pacienteDB) {
            return res.status(404).send('No se encontró el perfil del paciente.')
        }

        const pacienteVista = {
            id: pacienteDB.id_paciente,
            nombres: req.usuario.nombres,
            apellidos: req.usuario.apellidos,
            nombre: `${req.usuario.nombres} ${req.usuario.apellidos}`,
            correo: req.usuario.correo,
            telefono: req.usuario.telefono,
            fechaNacimiento: pacienteDB.fecha_nacimiento,
            tipoDocumento: req.usuario.tipo_documento,
            numeroDocumento: req.usuario.numero_documento,
            tipoSangre: pacienteDB.tipo_sangre,
            alergias: pacienteDB.alergias,
            condicionesMedicas: pacienteDB.condiciones_medicas,
            direccion: pacienteDB.direccion,
            departamento: pacienteDB.departamento,
            ciudad: pacienteDB.ciudad
        }
        res.render('viewsPaciente/profile', {
            tituloPagina: 'Mi Perfil',
            fechaActual: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date()),
            paciente: pacienteVista
        })
    } catch (error) {
        console.error('Error al renderizar la vista de perfil:', error)
        res.status(500).send('Error al cargar la vista del perfil.')
    }
})

// ======================================================
// VISTA: EDITAR PERFIL (GET /paciente/perfil/editar)
// ======================================================
router.get('/perfil/editar', auth, role(3), mostrarEdicionPerfil)
router.post('/perfil/editar', auth, role(3), guardarEdicionPerfil)
router.post('/perfil/cambiar-password', auth, role(3), cambiarContrasenaPaciente)

/* PORTAL DEL PACIENTE: GET /paciente/dashboard */
router.get('/dashboard', auth, role(3), async (req, res) => {
    try {
        const paciente = await obtenerOCrearPerfilPaciente(req.usuario.id_usuario)

        if (!paciente) {
            return res.status(404).send('No se encontró el perfil del paciente.')
        }

        const citasDB = await Cita.findAll({
            where: { paciente_id: paciente.id_paciente },
            // El panel solo necesita los datos básicos de la cita.
            attributes: ['id_cita', 'paciente_id', 'medico_id', 'estado_id', 'fecha', 'hora'],
            include: [
                {
                    model: Medico,
                    include: [
                        { model: Usuario, attributes: ['nombres', 'apellidos'] },
                        { model: Especialidad, attributes: ['nombre'] }
                    ]
                },
                { model: EstadoCita, as: 'Estado', attributes: ['nombre'] }
            ],
            order: [['fecha', 'ASC'], ['hora', 'ASC']]
        })

        const formatearFecha = (fecha) => new Intl.DateTimeFormat('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(`${fecha}T12:00:00`))

        const citas = citasDB.map((cita) => ({
            id: cita.id_cita,
            fecha: formatearFecha(cita.fecha),
            hora: String(cita.hora).slice(0, 5),
            consultorio: cita.Medico?.Especialidad?.nombre || 'Consulta médica',
            doctor: cita.Medico?.Usuario
                ? `Dr. ${cita.Medico.Usuario.nombres} ${cita.Medico.Usuario.apellidos}`
                : 'Médico asignado',
            estado: cita.Estado?.nombre || 'Estado no disponible'
        }))

        const proximaCita = citasDB.find((cita) =>
            ['Pendiente', 'Confirmada'].includes(cita.Estado?.nombre)
        )
        const proximaCitaVista = proximaCita ? {
            fecha: formatearFecha(proximaCita.fecha),
            doctor: proximaCita.Medico?.Usuario
                ? `Dr. ${proximaCita.Medico.Usuario.nombres} ${proximaCita.Medico.Usuario.apellidos}`
                : 'Médico asignado',
            consultorio: proximaCita.Medico?.Especialidad?.nombre || 'Consulta médica'
        } : null

        res.render('viewsPaciente/dashboard', {
            tituloPagina: 'Portal del Paciente',
            fechaActual: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date()),
            paciente: {
                nombre: `${req.usuario.nombres} ${req.usuario.apellidos}`,
                rol: 'Paciente'
            },
            activeSection: 'citas',
            citas,
            proximaCita: proximaCitaVista
        })
    } catch (error) {
        console.error('Error al cargar el dashboard del paciente:', error)
        res.status(500).send('Error al cargar el dashboard del paciente.')
    }
})

// ======================================================
// HISTORIAL DE DIAGNÓSTICOS DEL PACIENTE
// ======================================================

router.get(
    "/historial-diagnosticos",
    auth,
    role(3),
    obtenerHistorialDiagnosticos
);

router.get('/notificaciones', auth, role(3), listarConfiguracionNotificaciones);
router.post('/notificacion', auth, role(3), actualizarConfiguracionNotificaciones);

// Verificación de identidad antes de cancelar una cita.
router.get('/citas/:id/cancelar', auth, role(3), mostrarFormularioCancelacion)
router.post('/citas/:id/cancelar', auth, role(3), solicitarCodigoCancelacion)
router.post('/citas/:id/cancelar/verificar', auth, role(3), verificarCodigoCancelacion)
export default router
